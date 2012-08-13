class TaskBoardIssue < ActiveRecord::Base
  unloadable
  belongs_to :issue
end