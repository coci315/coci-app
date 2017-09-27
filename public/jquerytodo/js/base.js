(function () {
  'use strict';
  var $body = $('body');
  var $container = $('.container');
  var $form_add_task = $('.add-task');
  var $task_list = $('.task-list');
  var $task_detail = $('.task-detail');
  var $task_detail_mask = $('.task-detail-mask');
  var $task_info = $('.task-info');
  var $task_left = $('.task-left>span');
  var $task_switch = $('.task-switch');
  var $task_clear = $('.task-clear-completed');
  var task_list = [];
  var current_index;
  var current_tab;
  // 帮助函数，过滤html标签
  function escapeHTML(htmlStr) {
    return htmlStr.replace(/[<>"&]/g, function (m0) {
      switch (m0) {
        case '<':
          return '&lt;';
        case '>':
          return '&gt;';
        case '\"':
          return '&quot;';
        case '&':
          return '&amp;';
      }
    });
  }
  // 帮助函数，生成YYYY-MM-DD格式的日期字符串
  function getDate() {
    function paddingLeft(number) {
      return number < 10 ? '0' + number : '' + number;
    }
    var date = new Date(Date.now() + 60 * 60 * 1000);
    var year = date.getFullYear();
    var month = paddingLeft(date.getMonth() + 1);
    var day = paddingLeft(date.getDate());
    var hour = paddingLeft(date.getHours());
    var minute = paddingLeft(date.getMinutes());
    return year + '/' + month + '/' + day + ' ' + hour + ':' + minute;
  }


  init();
  initEvent();

  function initEvent() {
    $form_add_task.on('submit', on_add_task_form_submit);
    $task_list.on('click', '.delete', listen_task_delete);
    $task_list.on('click', '.detail', listen_task_detail);
    $task_list.on('dblclick', '.task-item', listen_task_item);
    $task_list.on('click', '.complete', listen_checkbox_complete);
    $task_detail_mask.on('click', hide_task_detail);
    $task_detail.on('click', '.cancel', hide_task_detail);
    $task_detail.on('submit', 'form', on_task_detail_form_submit);
    $task_detail.on('dblclick', '.content', listen_task_content);
    $task_switch.on('click', '.j-tab', listen_task_switch);
    $task_clear.on('click', listen_task_clear);
  }

  // 监听表单提交事件，提交表单时，添加任务
  function on_add_task_form_submit(e) {
    e.preventDefault();
    var new_task = {};
    new_task.desc = '';
    new_task.remind_date = getDate();
    new_task.complete = false;
    var $input = $(this).find('input[name=content]');
    new_task.content = escapeHTML($input.val().trim());
    if (!new_task.content) return;
    $input.val('');
    add_task(new_task);
  }

  // 监听任务详情的表单提交事件，提交表单时，更新任务详情
  function on_task_detail_form_submit(e) {
    e.preventDefault();
    var data = {};
    data.content = $(this).find('[name=content]').val();
    data.desc = $(this).find('[name=desc]').val();
    data.remind_date = $(this).find('[name=remind_date]').val();
    if (Date.now() - new Date(data.remind_date).getTime() < 0) {
      data.has_reminded = false;
    }
    update_task(current_index, data);
    hide_task_detail();
  }

  // 监听任务内容的双击事件，双击时显示编辑输入框
  function listen_task_content() {
    var $this = $(this);
    var $content_input = $this.parent().find('.content_input');
    $this.hide();
    $content_input.show();
  }

  // 监听删除按钮的点击事件，点击时删除任务
  function listen_task_delete() {
    var $this = $(this);
    var $item = $this.parent().parent();
    var index = $item.data('index');
    my_alert({
      title: '确定要删除吗？',
      confirm_handler: function () {
        delete_task(index);
      }
    });
  }

  // 监听任务项的双击事件，双击时显示任务详情
  function listen_task_item() {
    var index = $(this).data('index');
    show_task_detail(index);
  }

  // 监听详情按钮的点击事件，点击时显示任务详情
  function listen_task_detail() {
    var $this = $(this);
    var $item = $this.parent().parent();
    var index = $item.data('index');
    show_task_detail(index);
  }

  // 监听checkbox点击事件
  function listen_checkbox_complete() {
    var $this = $(this);
    var index = $this.parent().data('index');
    var data = {
      complete: $this.is(':checked')
    };
    update_task(index, data);
  }

  // 监听任务状态选项卡切换事件
  function listen_task_switch() {
    var tab = $(this).data('tab');
    if (tab !== current_tab) {
      set_current_tab(tab);
      render_task_list();
    }
  }

  // 设置task_info的显示隐藏
  function set_task_info_display() {
    if (task_list.length === 0) {
      $task_info.hide();
    } else {
      $task_info.show();
    }
  }

  // 设置current_tab
  function set_current_tab(tab) {
    current_tab = tab;
    store.set('current_tab', current_tab);
    $task_switch.find('.j-tab').removeClass('switch');
    $task_switch.find('.' + tab).addClass('switch');
  }

  // 监听清除所有已完成任务事件
  function listen_task_clear() {
    my_alert({
      title: '确定要删除所有已完成任务吗？',
      confirm_handler: function () {
        delete_completed_tasks();
      }
    });
  }

  // 设置剩余任务数
  function set_task_left_num() {
    var num = task_list.filter(function (task) {
      return !task.complete
    }).length;
    $task_left.text(num);
  }

  // 显示任务详情
  function show_task_detail(index) {
    render_task_detail(index);
    current_index = index;
    if ($task_list.height() > 200) {
      $task_detail.css({
        top: '',
        bottom: 0
      });
    } else {
      $task_detail.css({
        bottom: '',
        top: 0
      });
    }
    $task_detail.show('fast');
    $task_detail_mask.show();
  }

  // 更新任务详情
  function update_task(index, data) {
    if (index === undefined || !task_list[index]) return;
    task_list[index] = $.extend({}, task_list[index], data);
    refresh_task_list();
  }

  // 隐藏任务列表
  function hide_task_detail() {
    $task_detail.hide();
    $task_detail_mask.hide();
  }

  // 渲染任务详情
  function render_task_detail(index) {
    if (index === undefined || !task_list[index]) return;
    var item = task_list[index];
    var desc = item.desc ? item.desc : '';
    var remind_date = item.remind_date ? item.remind_date : '';
    var tpl =
      '<form>\
        <div class="content">' + item.content + '</div>\
        <div class="content_input" style="display:none;"><input type="text" name="content" value="' + item.content + '"></div>\
        <div>\
          <div class="desc">\
            <textarea name="desc" placeholder="添加一些描述...">' + desc + '</textarea>\
          </div>\
        </div>\
        <div class="remind">\
          <label for="remind_date">提醒时间</label>\
          <input id="remind_date" class="remind_date" type="text" name="remind_date" value="' + remind_date + '">\
        </div>\
        <div><button class="update" type="submit">更新</button><button class="cancel" type="button">取消</button></div>\
      </form>';
    $task_detail.html('');
    $task_detail.html(tpl);
    $('#remind_date').datetimepicker()
  }

  // 添加任务
  function add_task(new_task) {
    task_list.push(new_task);
    refresh_task_list()
    return true;
  }

  // 删除任务
  function delete_task(index) {
    if (index === undefined || !task_list[index]) return;
    task_list.splice(index, 1);
    refresh_task_list();
  }

  // 删除所有已完成任务
  function delete_completed_tasks() {
    for (var i = task_list.length - 1; i >= 0; i--) {
      if (task_list[i].complete) {
        task_list.splice(i, 1);
      }
    }
    refresh_task_list();
  }

  // 更新task_list----将新的task_list存储，并重新渲染
  function refresh_task_list() {
    sort_task_list_by_date();
    store.set('task_list', task_list);
    render_task_list();
  }

  // 将任务列表按时间排序
  function sort_task_list_by_date() {
    task_list.sort(function (a, b) {
      return new Date(a.remind_date) - new Date(b.remind_date);
    })
  }

  // 渲染task_list任务清单列表
  function render_task_list() {
    switch (current_tab) {
      case 'all':
        render_all_task_list();
        break;
      case 'completed':
        render_completed_task_list();
        break;
      case 'active':
        render_active_task_list();
        break;
      default:
        console.error('sth wrong with current_tab');
    }
    set_task_left_num();
    set_task_info_display();
  }

  // 渲染所有任务
  function render_all_task_list() {
    var tempArr = [];
    $task_list.html('');
    for (var i = 0; i < task_list.length; i++) {
      var $task = render_task_item(task_list[i], i);
      if (task_list[i].complete) {
        $task_list.prepend($task);
      } else {
        tempArr.push($task);
      }
    }
    tempArr.forEach(function ($task) {
      $task_list.prepend($task);
    });
  }

  // 只渲染已完成任务
  function render_completed_task_list() {
    $task_list.html('');
    for (var i = 0; i < task_list.length; i++) {
      var $task = render_task_item(task_list[i], i);
      if (task_list[i].complete) {
        $task_list.prepend($task);
      }
    }
  }

  // 只渲染未完成任务
  function render_active_task_list() {
    $task_list.html('');
    for (var i = 0; i < task_list.length; i++) {
      var $task = render_task_item(task_list[i], i);
      if (!task_list[i].complete) {
        $task_list.prepend($task);
      }
    }
  }

  // 渲染一项任务
  function render_task_item(data, index) {
    var list_item_tpl =
      '<div class="task-item ' + (data.complete ? 'completed' : '') + '" data-index="' + index + '">\
        <input type="checkbox" class="complete" ' + (data.complete ? "checked" : "") + '>\
        <span class="task-content">' + data.content + '</span>\
        <span class="fr">\
          <span class="action delete"> 删除</span>\
          <span class="action detail"> 详情</span>\
        </span>\
        <span class="fr task-remind_date">' + data.remind_date + '</span>\
      </div>';
    return $(list_item_tpl);
  }

  // 初始化current_tab
  function init_current_tab() {
    var tab = store.get('current_tab') || 'all';
    set_current_tab(tab);
  }

  // 初始化，从本地存储中取出task_list
  function init_task_list() {
    task_list = store.get('task_list') || [];
    if (task_list.length) {
      render_task_list();
    } else {
      set_task_left_num();
      set_task_info_display();
    }
    task_remind_check();
  }

  // 对第一次使用进行初始化
  function init_first_use() {
    if (!store.get('not_first_use')) {
      store.set('not_first_use', true);
      // 测试用例
      var task_list = [{
        complete: true,
        content: '晚上6点打电话给小明',
        desc: '',
        has_reminded: true,
        remind_date: '2017/06/09 18:00'
      }, {
        complete: true,
        content: '下午2点去超市',
        desc: '',
        has_reminded: true,
        remind_date: '2017/06/17 14:00'
      }, {
        complete: true,
        content: '京东618活动',
        desc: '',
        has_reminded: true,
        remind_date: '2017/06/18 09:00'
      }, {
        complete: true,
        content: '周六去动物园',
        desc: '',
        has_reminded: true,
        remind_date: '2017/06/24 08:00'
      }, {
        complete: false,
        content: '周日大扫除',
        desc: '',
        has_reminded: false,
        remind_date: '2017/07/01 14:00'
      }, {
        complete: false,
        content: '参加会议',
        desc: '',
        has_reminded: false,
        remind_date: '2017/08/12 19:00'
      }];
      store.set('task_list', task_list);
    }
  }

  // 初始化
  function init() {
    init_first_use();
    init_current_tab();
    init_task_list();
  }

  // 检查任务提醒
  function task_remind_check() {
    setInterval(function () {
      var now = new Date().getTime();
      for (var i = 0; i < task_list.length; i++) {
        var task = task_list[i];
        if (task.remind_date && !task.has_reminded) {
          var time = new Date(task.remind_date).getTime();
          if (now - time > 0) {
            task.has_reminded = true;
            refresh_task_list();
            show_msg(task.content);
          }
        }
      }
    }, 1000);
  }

  // 显示消息
  function show_msg(msg) {
    if (!msg) {
      return console.error('msg is required');
    }
    $('.alert').get(0).play();
    var $msg = $('<div style="display:none;" class="msg">\
                    <div>' + msg + '<span class="close">x</span></div>\
                  </div>')
      .css({
        width: '100%',
        margin: '5px 0',
        height: 30,
        lineHeight: '30px',
        backgroundColor: 'rgb(233, 226, 153)',
        borderRadius: '0 0 3px 3px',
        color: 'rgb(129, 59, 151)',
        textAlign: 'center'
      });
    var $close = $msg.find('.close');
    $close.on('click', function () {
      $msg.slideUp('slow', function () {
        $msg.remove();
      });
    });
    $msg.prependTo($container);
    $msg.slideDown('slow');
  }


  // 自定义alert
  function my_alert(arg) {
    if (!arg) {
      return console.error('alert title is required');
    }
    var opts = {};
    if (typeof arg === 'string') {
      opts.title = arg;
    } else {
      opts = $.extend({}, opts, arg);
    }

    var $box = $('<div style="display:none" class="my_alert">\
                    <div class="alert_title"></div>\
                    <div class="alert_content">\
                    </div>\
                    <div class="alert_footer">\
                      <button class="confirm">确定</button>\
                      <button class="cancel">取消</button>\
                    </div>\
                  </div>')
      .css({
        position: 'fixed',
        top: '50%',
        left: '50%',
        padding: '15px 10px',
        width: 300,
        height: 200,
        marginLeft: -150,
        marginTop: -100,
        backgroundColor: '#fff',
        borderRadius: 3,
        boxShadow: '0 1px 2px rgba(0,0,0,.5)',
        color: '#444'
      });
    var $title = $box.find('.alert_title')
      .css({
        padding: '5px 10px',
        fontWeight: 'bold',
        fontSize: 20,
        textAlign: 'center'
      })
      .text(opts.title);
    var $content = $box.find('.alert_content')
      .css({
        padding: '5px 10px',
        margin: '20px 0',
        textAlign: 'center'
      });
    if (opts.content) {
      $content.text(opts.content);
    }
    var $confirm = $box.find('.confirm');
    var $cancel = $box.find('.cancel');
    var $mask = $('<div></div>')
      .css({
        position: 'fixed',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,.4)'
      });
    $confirm.on('click', on_confirm);
    $cancel.on('click', on_cancel);
    $mask.on('click', on_cancel);

    opts.confirm_handler && $box.on('confirm', opts.confirm_handler);
    opts.cancel_handler && $box.on('cancel', opts.cancel_handler);

    function on_confirm() {
      $box.trigger('confirm');
      destory_alert();
    }

    function on_cancel() {
      $box.trigger('cancel');
      destory_alert();
    }

    function destory_alert() {
      $box.remove();
      $mask.remove();
    }
    $mask.appendTo($body);
    $box.appendTo($body);
    $box.show('fast');
  }

})();