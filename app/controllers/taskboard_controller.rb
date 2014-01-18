class TaskboardController < ApplicationController
  unloadable

  before_filter :find_project
  before_filter :authorize
  helper_method :column_manager_locals

  def index
    @columns = TaskBoardColumn.find_all_by_project_id(@project.id, :order => 'weight')
    @status_names = Hash.new
    IssueStatus.select([:id, :name]).each do |status|
      @status_names[status.id] = status.name
    end
  end

  def save
    params[:sort].each do |status_id, issues|
      weight = 0;
      issues.each do |issue_id|
        tbi = TaskBoardIssue.find_by_issue_id(issue_id).update_attribute(:project_weight, weight)
        weight += 1
      end
    end
    if params[:move] then
      params[:move].each do |issue_id, new_status_id|
        issue = Issue.find(issue_id).update_attribute(:status_id, new_status_id)
      end
    end
    respond_to do |format|
      format.js{ head :ok }
    end
  end

  def archive_issues
    params[:ids].each do |issue_id|
      TaskBoardIssue.find_by_issue_id(issue_id).update_attribute(:is_archived, true)
    end
    respond_to do |format|
      format.js{ head :ok }
    end
  end

  def unarchive_issue
    TaskBoardIssue.find_by_issue_id(params[:issue_id]).update_attribute(:is_archived, false)
    respond_to do |format|
      format.js{ head :ok }
    end
  end

  def create_column
    @column = TaskBoardColumn.new :project => @project, :title => params[:title]
    @column.save
    render 'settings/update'
  end

  def delete_column
    @column = TaskBoardColumn.find(params[:column_id])
    @column.delete
    render 'settings/update'
  end
  
  def update_columns
    params[:column].each do |column_id, new_state|
      column = TaskBoardColumn.find(column_id.to_i)
      print column.title + ' ' + new_state[:weight] + ". "
      column.weight = new_state[:weight].to_i
      column.max_issues = new_state[:max_issues].to_i
      column.save!
      column.issue_statuses.clear()
    end
    params[:status].each do |status_id, column_id|
      status_id = status_id.to_i
      column_id = column_id.to_i
      unless column_id == 0
        @columns = TaskBoardColumn.find(column_id)
        @columns.issue_statuses << IssueStatus.find(status_id)
      end
    end
    render 'settings/update'
  end

  private

  def find_project
    # @project variable must be set before calling the authorize filter
    if (params[:project_id]) then
      @project = Project.find(params[:project_id])
    elsif(params[:issue_id]) then
      @project = Issue.find(params[:issue_id]).project
    end
  end

end