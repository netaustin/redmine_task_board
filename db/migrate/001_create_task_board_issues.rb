class CreateTaskBoardIssues < ActiveRecord::Migration
  def change
    create_table :task_board_issues do |t|
      t.references :issue
      t.integer :project_weight, :default => 0
      t.integer :global_weight, :default => 0
      t.integer :assignee_weight, :default => 0
      t.boolean :is_archived, :default => false
    end
  end
end
