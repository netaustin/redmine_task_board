# Plugin's routes
# See: http://guides.rubyonrails.org/routing.html

get 'users/:id/taskboard', :to => 'my_taskboard#index'
post 'users/:id/taskboard/save', :to => 'my_taskboard#save'
get 'my/taskboard', :to => 'my_taskboard#my_index'
get 'projects/:project_id/taskboard', :to => 'taskboard#index'
post 'projects/:project_id/taskboard/save', :to => 'taskboard#save'
post 'projects/:project_id/taskboard/archive-issues', :to => 'taskboard#archive_issues'
post 'issues/:issue_id/taskboard-unarchive', :to => 'taskboard#unarchive_issue'
post 'projects/:project_id/taskboard/columns/create', :to => 'taskboard#create_column', :as => :project_taskboard_columns_create
delete 'projects/:project_id/taskboard/columns/:column_id/delete', :to => 'taskboard#delete_column', :as => :project_taskboard_columns_delete
put 'projects/:project_id/taskboard/columns/update', :to => 'taskboard#update_columns', :as => :project_taskboard_columns_update