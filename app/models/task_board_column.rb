class TaskBoardColumn < ActiveRecord::Base
  unloadable
  belongs_to :project
  has_and_belongs_to_many :issue_statuses
  validates_presence_of :title, :project
  validates_length_of :title, :maximum => 255

  def self.empty_status(status_id)
    columns = TaskBoardColumn \
      .select(:id) \
      .joins('INNER JOIN issue_statuses_task_board_columns istbc ON istbc.task_board_column_id = task_board_columns.id') \
      .where('istbc.issue_status_id = ?', status_id)
    puts columns
    return columns.empty?
  end

  def issues(order_column="project_weight")
  	@column_statuses = Hash.new
        subproject_ids = [project.id]
        include_subprojects = \
            Setting.plugin_redmine_task_board['include_subprojects'].to_i == 1
        if include_subprojects
            subproject_ids = project.self_and_descendants.collect {|p| p.id}.flatten
        end
  	self.issue_statuses.order(:name).each do |status|
  		@column_statuses[status.id] = Array.new
  		issues = Issue.select("issues.*, tbi.is_archived, tbi.#{order_column} as weight, tbi.issue_id") \
  			.joins('LEFT OUTER JOIN task_board_issues AS tbi ON tbi.issue_id = issues.id') \
  			.where("project_id IN (?) AND status_id = ? AND (is_archived IS NULL OR is_archived = FALSE)", subproject_ids, status.id) \
  			.order("weight ASC, created_on ASC")
  		issues.each do |issue|
        # Create a TaskBoardIssue (i.e. a Card) if one doesn't exist already.
  			unless issue.issue_id
          closed_and_old = (status.is_closed? and issue.updated_on.to_date < 14.days.ago.to_date)
  				tbi = TaskBoardIssue.new(:issue_id => issue.id, :is_archived => closed_and_old)
          tbi.save
          if closed_and_old
            next
          end
  			end
        @column_statuses[status.id] << issue
  		end
  	end
  	return @column_statuses
  end

end
