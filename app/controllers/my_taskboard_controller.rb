class MyTaskboardController < ApplicationController
  unloadable

  before_filter :my_account_or_admin

  def my_index
    index
    render 'index'
  end

  def index
    issues = Issue.select( \
          "issues.id,
          issues.subject,
          issues.status_id,
          projects.name as project_name,
          trackers.name as tracker_name,
          issue_priority.name as priority_name,
          issue_priority.id as priority_id,
          projects.id as project_id,
          tba.weight,
          issue_statuses.name as status_name,
          tba.issue_id"
        ) \
        .joins('LEFT OUTER JOIN task_board_assignees AS tba ON tba.issue_id = issues.id AND tba.assignee_id = issues.assigned_to_id') \
        .joins('INNER JOIN issue_statuses ON issues.status_id = issue_statuses.id') \
        .joins('INNER JOIN trackers ON trackers.id = issues.tracker_id') \
        .joins('INNER JOIN projects ON projects.id = issues.project_id') \
        .joins('INNER JOIN enumerations issue_priority ON issues.priority_id = issue_priority.id') \
        .where("assigned_to_id = ? AND issue_statuses.is_closed = false AND projects.status = 1", @user.id) \
        .order("weight ASC, issue_priority.position DESC")
    @not_prioritized = Array.new
    @prioritized = Array.new

    issues.each do |issue|
      if issue.weight == nil or issue.weight == 0
        @not_prioritized << issue
      else
        @prioritized << issue
      end
    end
  end

  def save
    TaskBoardAssignee.destroy_all(:assignee_id => @user.id)
    weight = 1;
    used_ids = Array.new
    params[:sort].each do |issue_id|
      unless used_ids.include? issue_id
        used_ids << issue_id
        tba = TaskBoardAssignee.where(:issue_id => issue_id, :assignee_id => @user.id).first_or_create(:weight => weight)
        weight += 1
      end
    end
    respond_to do |format|
      format.js{ head :ok }
    end
  end

  def my_account_or_admin
    find_user
    if @user.id != User.current.id
      require_admin
    end
    true
  end

  def find_user
    if params[:id] == nil
      params[:id] = User.current.id
    end

    if params[:id] == 'current'
      require_login || return
      @user = User.current
    else
      @user = User.find(params[:id])
    end
  rescue ActiveRecord::RecordNotFound
    render_404
  end

end
