class StatusBucket < ActiveRecord::Base
  default_scope {
  	order('weight ASC')
  }
  belongs_to :issue_status
  belongs_to :task_board_column
  unloadable
end
