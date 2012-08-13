class CreateTaskBoardColumns < ActiveRecord::Migration
  def change
    create_table :task_board_columns do |t|
      t.references :project
      t.string :title
      t.integer :weight, :default => 0
      t.integer :max_issues, :default => 0
    end

    create_table :issue_statuses_task_board_columns, :id => false do |t|
      t.references :issue_status, :task_board_column
    end

    add_index :issue_statuses_task_board_columns, [:issue_status_id, :task_board_column_id], {:name => 'issue_statuses_task_board_columns_idx'}
  end
end
