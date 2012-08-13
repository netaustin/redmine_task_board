class RedmineTaskBoardHookListener < Redmine::Hook::ViewListener
  render_on :view_issues_show_description_bottom, :partial => "taskboard/issue_description"
end