/* Simple JavaScript Inheritance
 * By John Resig http://ejohn.org/
 * MIT Licensed.
 */
(function(){
  var initializing = false, fnTest = /xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/;
  this.Class = function(){};
  Class.extend = function(prop) {
    var _super = this.prototype;
    initializing = true;
    var prototype = new this();
    initializing = false;
    for (var name in prop) {
      prototype[name] = typeof prop[name] == "function" &&
        typeof _super[name] == "function" && fnTest.test(prop[name]) ?
        (function(name, fn){
          return function() {
            var tmp = this._super;
            this._super = _super[name];
            var ret = fn.apply(this, arguments);        
            this._super = tmp;
            return ret;
          };
        })(name, prop[name]) :
        prop[name];
    }
    function Class() {
      if ( !initializing && this.init )
        this.init.apply(this, arguments);
    }
    Class.prototype = prototype;
    Class.prototype.constructor = Class;
    Class.extend = arguments.callee;
   
    return Class;
  };
})();

var TaskBoardFilters = Class.extend({
  filters: {
    priority: 0,
    category: 0,
    assignee: 0, // only used on project taskboard
    project: 0 // only used on "my" taskboard
  },
  init: function() {
    var self = this;
    $('#taskboard-filters').on('change', 'select', function() {
      self.setFilter($(this));
      self.applyFilters();
    });
    $('#taskboard-filters [name]').each(function(i, filter) {self.setFilter(filter);});
    self.applyFilters();
  },
  setFilter: function(input) {
    var self = this;
    self.filters[$(input).attr('name')] = parseInt($(input).val());
  },
  applyFilters: function() {
    var self = this;
    $('#sortable-root').find('li.card').each(function() {
      var minimized = false;
      for (var f in self.filters) {
        if (self.filters[f] == 0 || self.filters[f] == parseInt($(this).data(f))) {
          continue;
        }
        else {
          minimized = true;
          break;
        }
      }
      if (minimized) $(this).hide();
      else $(this).show();
    });
  }
});

var TaskBoardSortable = Class.extend({
  
  sortable: null,
  id: null,
  options: {},
  
  init: function(id, options) {
    this.id = id;
    this.options = options;
    this.options.change = this.onChange.bind(this);
    this.options.update = this.onUpdate.bind(this);
    this.root = $('#' + this.id);
    this.root.sortable(this.options);
  },
  
  onChange: function() { },

  onUpdate: function() { }

});

var TaskBoardPane = TaskBoardSortable.extend({

  init: function(id, options) {
    this._super(id, options);
    this.max_issues = parseInt(this.root.data('max-issues'));
    this.root.data('card-count', this.getNumberOfCards());
  },

  getNumberOfCards: function() {
    return this.root.find('.card').length;
  },

  onUpdate: function(e, ui) {
    // Add or remove 'empty' class
    var list = ui.item.parent();
    if (list.hasClass('empty') && list.find('.card').length > 0) {
      list.removeClass('empty');
    }
    else if (list.find('.card').length == 0) {
      list.addClass('empty');
    }

    // Deal with max issue limit
    if (this.max_issues > 0 && this.root.find('.card').length > this.max_issues) {
      var i = 1;
      var self = this;
      this.root.find('.card').each(function() {
        // Clear legal cards of the over-limit class
        if (i <= self.max_issues) {
          $(this).removeClass('over-limit');
        }

        // Add a dashed line under the last legal issue, reset others
        if (self.max_issues == i) {
          $(this).addClass('at-limit');
        }
        else {
          $(this).removeClassName('at-limit');
        }

        // Add over-limit class to over-limit issues
        if (i > self.max_issues) {
          $(this).addClass('over-limit');
        }
        i++;
      });
    }
    else {
      this.root.find('.card').each(function() {
        $(this).removeClass('over-limit');
        $(this).removeClass('at-limit');
      });
    }

    // handle card movements

    // a card has been moved into this column.
    if (this.getNumberOfCards() > list.data('card-count')) {
      list.find('.card').each(function() {
        var card = $(this);
        if (list.data('status-id') != card.data('status-id')) {
          TaskBoardUtils.save([
            TaskBoardUtils.column_serialize(list), // save ordering of this column
            TaskBoardUtils.column_serialize($('#' + 'column_' + $(this).data('status-id'))), // save ordering of previous column
            TaskBoardUtils.moveParam($(this).data('issue-id'), list.data('status-id'))
          ], {
            success: function() {
              card.attr('data-status-id', list.data('status-id'));
              card.data('status-id', list.data('status-id'));
            },
            error: function(xhr) {
              var resp = jQuery.parseJSON(xhr.responseText);
              $.each(resp, function(idx, data) {
                card = $('#issue_' + data.issue_id);
                var prev_list = $('.taskboard-pane ul[data-status-id=' + data.status_id +']');
                var prev_sibling = prev_list.find('#issue_' + data.previous_sibling_id);
                card.addClass('move-error');
                card.slideUp({ complete: function() {
                  if (prev_sibling.length) {
                    card.insertAfter(prev_sibling);
                  } else {
                    card.prependTo(prev_list);
                  }
                  card.slideDown({ complete: function() {
                    card.removeClass('move-error');
                  }});
                }});
              });
            }
          });
        }
      });
    }

    // this column has been reordered
    else if(this.getNumberOfCards() == list.data('card-count')) {
      TaskBoardUtils.save([TaskBoardUtils.column_serialize(list)]);
    }

    // We don't handle (this.getNumberOfCards() < $(this.id).readAttribute('data-card-count'))
    // because the gaining column handles re-weighting for the losing column for AJAX efficiency.

    list.data('card-count', this.getNumberOfCards());
  },

});

var MyTaskBoardPane = TaskBoardSortable.extend({

  init: function(id, options) {
    this._super(id, options);
    this.root.data('card-count', this.getNumberOfCards());
  },

  getNumberOfCards: function() {
    return this.root.find('.card').length;
  },

  onUpdate: function(e, ui) {
    // Add or remove 'empty' class
    var list = ui.item.parent();
    if (list.hasClass('empty') && list.find('.card').length > 0) {
      list.removeClass('empty');
    }
    else if (list.find('.card').length == 0) {
      list.addClass('empty');
    }

    var priority_list = [];
    $('#prioritized').find('li.card').each(function() {
      priority_list.push('sort[]=' + $(this).data('issue-id'));
    });
    TaskBoardUtils.save(priority_list);

    // We don't handle (this.getNumberOfCards() < $(this.id).readAttribute('data-card-count'))
    // because the gaining column handles re-weighting for the losing column for AJAX efficiency.


    list.data('card-count', this.getNumberOfCards());
  },

});

var TaskBoardUtils = {

  column_serialize: function(list) {
    var params = [];
    list.find('.card').each(function() {
      params.push('sort[' + list.data('status-id') + '][]=' + $(this).data('issue-id'));
    });
    return params.join('&');
  },

  moveParam: function(issue_id, new_status_id) {
    return 'move[' + issue_id + ']=' + new_status_id;
  },

  save: function(params, options) {
    $('#ajax-indicator').show();
    options = $.extend(options || {}, {
      type: 'post',
      data: params.join('&'),
      complete: function() {
        $('#ajax-indicator').hide();
      }
    });
    $.ajax(project_save_url, options);
  },

  checkboxListener: function() {
    TaskBoardUtils.hideButtonsIfNoneChecked();
    $(document).on('click', '.card input[type="checkbox"]', function() {
      if (!$('#taskboard-buttons').is(':visible') && this.checked) {
        $('#taskboard-buttons').show();
      }
      if (!this.checked) {
        TaskBoardUtils.hideButtonsIfNoneChecked();
      }
    });

    $(document).on('click', '#edit-issues', function() {
      location.href = '/issues/bulk_edit?' + TaskBoardUtils.serializeCheckedButtons();
    });

    $(document).on('click', '#archive-issues', function() {
      $('#ajax-indicator').show();
      $.ajax(project_archive_url, {
        type: 'post',
        data: TaskBoardUtils.serializeCheckedButtons(),
        complete: function() {
          $('#ajax-indicator').hide();
        },
        success: function() {
          $('.card input[type="checkbox"]').each(function() {
            if ($(this).is(':checked')) {
              $('#issue_' + $(this).val()).remove();
            }
          });
        }
      });
    });
  },

  hideButtonsIfNoneChecked: function() {
    var found_checked = false;
    $('.card input[type="checkbox"]').each(function() {
      if (this.checked) {
        found_checked = true;
        return false;
      }
    });
    if (!found_checked) {
      $('#taskboard-buttons').hide();
    }
  },

  serializeCheckedButtons: function() {
    var params = [];
    $('.card input[type="checkbox"]').each(function() {
      if (this.checked) {
        params.push('ids[]=' + $(this).val());
      }
    });
    return params.join('&');
  }
}

var TaskBoardSettings = TaskBoardSortable.extend({
  
  onUpdate: function(e, ui) {
    var weight = 0;
    var self = this;
    this.root.find(this.options.items).each(function() {
      var weightInput = $(this).find(self.options.weightSelector);
      if ($(weightInput).length > 0) $(weightInput).val(weight++);
    });
  }

});

var TaskBoardStatuses = TaskBoardSortable.extend({
  init: function(cls, options) {
    this.cls = cls;
    this.options = options;
    this.options.update = this.setInputs;
    this.root = $('.' + this.cls);
    this.root.sortable(this.options);
    this.setInputs();
  },

  setInputs: function() {
    $('div.dyn-column').each(function() {
      var weight = 0,
          column_id = $(this).data('column-id'),
          $input_wrapper = $(this).find('div.input-wrapper');
      $input_wrapper.empty();
      $(this).find('.status-pill').each(function() {
        $input_wrapper.append(
          '<input type="hidden" name="status[' + column_id + '][' + $(this).data('status-id') + ']" value=' + (weight++) + '" />'
        );
      });
    });
  }
})
