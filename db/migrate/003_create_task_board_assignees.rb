class CreateTaskBoardAssignees < ActiveRecord::Migration
  def change
    create_table :task_board_assignees do |t|
      t.integer :issue_id
      t.integer :assignee_id
      t.integer :weight
    end
    add_index :task_board_assignees, :issue_id
    add_index :task_board_assignees, :assignee_id
  end
end
