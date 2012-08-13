var TaskBoardSortable = Class.create({
  
  sortable: null,
  id: null,
  options: {},
  
  initialize: function(id, options) {
    this.id = id;
    this.options = options;
    this.options.onChange = this.onChange.bind(this);
    this.options.onUpdate = this.onUpdate.bind(this);
    Sortable.create(id, this.options);
  },
  
  onChange: function() { },

  onUpdate: function() { }

});

var TaskBoardPane = Class.create(TaskBoardSortable, {

  initialize: function($super, id, options) {
    $super(id, options);
    this.max_issues = parseInt($(id).readAttribute('data-max-issues'));
    $(this.id).writeAttribute('data-card-count', this.getNumberOfCards());
  },

  getNumberOfCards: function() {
    return $(this.id).select('.card').length;
  },

  onUpdate: function(list) {
    // Add or remove 'empty' class
    if (list.hasClassName('empty') && list.descendants().length > 0) {
      list.removeClassName('empty');
    }
    else if (list.descendants().length == 0) {
      list.addClassName('empty');
    }

    // Deal with max issue limit
    if (this.max_issues > 0 && $(this.id).childElements().length > this.max_issues) {
      var i = 1;
      $(this.id).childElements().each((function(card) {
        // Clear legal cards of the over-limit class
        if (i <= this.max_issues) {
          card.removeClassName('over-limit');
        }

        // Add a dashed line under the last legal issue, reset others
        if (this.max_issues == i) {
          card.addClassName('at-limit');
        }
        else {
          card.removeClassName('at-limit');
        }

        // Add over-limit class to over-limit issues
        if (i > this.max_issues) {
          console.log('over limit');
          card.addClassName('over-limit');
        }
        i++;
      }).bind(this));
    }
    else {
      $(this.id).childElements().each(function(card) {
        card.removeClassName('over-limit');
        card.removeClassName('at-limit');
      });
    }

    // handle card movements

    // a card has been moved into this column.
    if (this.getNumberOfCards() > $(this.id).readAttribute('data-card-count')) {
      list.childElements().each(function(card) {
        if (list.readAttribute('data-status-id') != card.readAttribute('data-status-id')) {
          TaskBoardUtils.save([
            TaskBoardUtils.serialize($(list.id)), // save ordering of this column
            TaskBoardUtils.serialize($('column_' + card.readAttribute('data-status-id'))), // save ordering of previous column
            TaskBoardUtils.moveParam(card.readAttribute('data-issue-id'), list.readAttribute('data-status-id'))
          ], {
            onSuccess: function() {
              card.writeAttribute('data-status-id', list.readAttribute('data-status-id'));
            }
          });
        }
      });
    }

    // this column has been reordered
    else if(this.getNumberOfCards() == $(this.id).readAttribute('data-card-count')) {
      TaskBoardUtils.save([TaskBoardUtils.serialize($(list.id))]);
    }

    // We don't handle (this.getNumberOfCards() < $(this.id).readAttribute('data-card-count'))
    // because the gaining column handles re-weighting for the losing column for AJAX efficiency.

    list.writeAttribute('data-card-count', this.getNumberOfCards());
  },

});

var TaskBoardUtils = {

  serialize: function(list) {
    var params = [];
    list.childElements().each(function(card) {
      params.push('sort[' + list.readAttribute('data-status-id') + '][]=' + card.readAttribute('data-issue-id'));
    });
    return params.join('&');
  },

  moveParam: function(issue_id, new_status_id) {
    return 'move[' + issue_id + ']=' + new_status_id;
  },

  save: function(params) {
    var options = Object.extend({
      method: 'post',
      parameters: params.join('&'),
      onLoading: function() {
        $('ajax-indicator').show();
      },
      onComplete: function() {
        $('ajax-indicator').hide();
      }
    }, arguments[1] || {});

    new Ajax.Request(project_save_url, options);
  },

  checkboxListener: function() {
    TaskBoardUtils.hideButtonsIfNoneChecked();
    $$('.card input[type="checkbox"]').invoke('observe', 'click', function(field) {
      if (!$('taskboard-buttons').visible() && this.checked) {
        $('taskboard-buttons').show();
      }
      if (!this.checked) {
        TaskBoardUtils.hideButtonsIfNoneChecked();
      }
    });

    $('edit-issues').observe('click', function() {
      location.href = '/issues/bulk_edit?' + TaskBoardUtils.serializeCheckedButtons();
    });

    $('archive-issues').observe('click', function() {
      new Ajax.Request(project_archive_url, {
        method: 'post',
        parameters: TaskBoardUtils.serializeCheckedButtons(),
        onLoading: function() {
          $('ajax-indicator').show();
        },
        onComplete: function() {
          $('ajax-indicator').hide();
        },
        onSuccess: function() {
          $$('.card input[type="checkbox"]').each(function(cb) {
            if (cb.checked) {
              $('issue_' + cb.value).remove();
            }
          });
        }
      });
    });
  },

  hideButtonsIfNoneChecked: function() {
    var found_checked = false;
    $$('.card input[type="checkbox"]').each(function(cb) {
      if (cb.checked) {
        found_checked = true;
        throw $break;
      }
    });
    if (!found_checked) {
      $('taskboard-buttons').hide();
    }
  },

  serializeCheckedButtons: function() {
    var params = [];
    $$('.card input[type="checkbox"]').each(function(cb) {
      if (cb.checked) {
        params.push('ids[]=' + cb.value);
      }
    });
    return params.join('&');
  }
}

var TaskBoardSettings = Class.create(TaskBoardSortable, {
  
  onChange: function() {
    var weight = 0;
    $(this.id).select(this.options.tag).each((function(el) {
      var weightInput = el.down(this.options.weightSelector);
      console.log(weightInput);
      weightInput.writeAttribute('value', weight++);
    }).bind(this));
  }

});