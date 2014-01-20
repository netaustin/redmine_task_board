class CreateStatusBuckets < ActiveRecord::Migration
  def self.up
    create_table :status_buckets do |t|
      t.integer :issue_status_id
      t.integer :task_board_column_id
      t.integer :weight
    end
    
    column_statuses = ActiveRecord::Base.connection.execute("SELECT issue_status_id, task_board_column_id FROM issue_statuses_task_board_columns ORDER BY issue_status_id, task_board_column_id")
    weight = 0
    column_statuses.each do |status|
      StatusBucket.create!(:task_board_column_id => status[1], :issue_status_id => status[0], :weight => weight )
      weight += 1
    end

    # finally, dump the old hatbm associations
    drop_table :issue_statuses_task_board_columns

  end
end