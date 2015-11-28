// ==UserScript==
// @name CatChan
// @version 2015.11.29.0
// @description Cross domain catalog for imageboards
// @include http*://*krautchan.net/*
// @include http*://boards.4chan.org/*
// @include http://*.2chan.net/*
// @include http*://8chan.co/*
// @include http*://8ch.net/*
// @include http*://lainchan.org/*
// @require https://raw.githubusercontent.com/nnnick/Chart.js/master/Chart.js
// @updateURL https://raw.github.com/Dogman8/CatChan/master/CatChan.meta.js
// @grant unsafeWindow
// ==/UserScript==
//
//    Copyright 2014 DogMan8
//
//    This program is free software: you can redistribute it and/or modify
//    it under the terms of the GNU General Public License as published by
//    the Free Software Foundation, version 3 of the License.
//
//    This program is distributed in the hope that it will be useful,
//    but WITHOUT ANY WARRANTY; without even the implied warranty of
//    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//    GNU General Public License for more details.
//
//    You should have received a copy of the GNU General Public License
//    along with this program.  If not, see <http://www.gnu.org/licenses/>.
//


(function (){
//  if (window.top != window.self) return; //don't run on frames or iframes
//if (window.top != window.self && window.name!='KC' && window.name!='4chan' && window.name!='8chan') return; //don't run on frames or iframes
if (window.top != window.self && window.name==='') return; //don't run on frames or iframes




//  http://stackoverflow.com/questions/9791489/greasemonkey-require-does-not-work-in-chrome
//  http://stackoverflow.com/questions/2246901/how-can-i-use-jquery-in-greasemonkey-scripts-in-google-chrome
//  http://stackoverflow.com/questions/17341122/link-and-execute-external-javascript-file-hosted-on-github

  var brwsr = {
    ff: (navigator.userAgent.indexOf("Firefox") != -1),
    sw_cache: true,
    JSON_parse: function(val){ // patch for Tampermonkey.
                       var retval = JSON.parse(val);
//                       if (GM_setValue)
//                       if (typeof(retval)==='object')
//                       for (var i in retval) if (typeof(retval[i])==='string' && retval[i].startsWith('[') && retval[i].endsWith(']')) retval[i] = brwsr.JSON_parse(retval[i]);}
                       for (var i in retval) if (typeof(retval[i])==='string' && retval[i].search(/^\[.*\]$/)!=-1) retval[i] = brwsr.JSON_parse(retval[i]);
                       return retval;
                     },
  };
  brwsr.innerText  = (!brwsr.ff)? 'innerText' : 'textContent';
  brwsr.Date_parse = (!brwsr.ff)? Date.parse : function(str){return Date.parse(str.replace(/ /,'T'));};
  brwsr.document_body = (!brwsr.ff)? document.body : document.documentElement;
  brwsr.mousewheel = (!brwsr.ff)? 'mousewheel' : 'DOMMouseScroll';

  var DelayBuffer = function(tgt, delay){
    this.tgt = tgt;
    this.delay = delay;
    this.id = null;
  };
  DelayBuffer.prototype = {
    do_tgt: function(){this.id = null; this.tgt();}, 
    delayed_do: function(){
      if (this.id===null) this.id = setTimeout(this.do_tgt.bind(this),
        (typeof(this.delay)==='number')? this.delay: (this.hasFocus)? this.delay.fg : this.delay.bg);},
    cancel: function(){if (this.id!==null) {clearTimeout(this.id);this.id=null;}},
    binded_delayed_do: function(){return this.delayed_do.bind(this);},
    hasFocus: true
  };

  var MutexWithWatchdog = function(name){ // watchdog for 8chan's unstability.
    this.mutex = true;
    this.name = name;
    this.abort_req = false;
    this.wdg = new DelayBuffer(this.fire.bind(this), 30000);
//    this.wdg = new DelayBuffer(function(){ // working code.
//      this.mutex = true;
//      if (pref.debug_mode['7']) console.log('watchdog: '+this.name);}.bind(this), 30000);
  }
  MutexWithWatchdog.prototype = {
    get: function(){
      if (this.mutex && !this.abort_req) {
        this.mutex = false;
        this.wdg.delayed_do();
        if (pref.debug_mode['5']) console.log('mutex: get: '+this.name);
        return true;
      } else {
        if (pref.debug_mode['5']) console.log('mutex: fail: '+this.name);
        this.abort_req = false;
        return false;
      }
    },
    restart: function(){
      this.wdg.cancel();
      this.wdg.delayed_do();
    },
    stop: function(){
      this.wdg.cancel();
      this.mutex = true;
      if (pref.debug_mode['5']) console.log('mutex: release: '+this.name);
    },
    fire: function(){
      this.mutex = true;
      cataLog.scan_boards.scan_init(this.name, {}, {});
      if (pref.debug_mode['7']) console.log('watchdog: '+this.name);
    },
    abort: function(){
      this.abort_req = true;
      this.stop();
    }
  }

  var pref = pref_default();
  function pref_default() {
    var pref_new = {
      script_prefix: 'CatChan',
      features: {page: true, graph: true, setting: true, setting2: true, postform: true, catalog: true, listener : true, uip_tracker: true, thread_reader: true, debug: false},
      max_capture: 576,
      interval_found: 10,
      write_to_ls: true,
      aggregator: 'true', // radiobutton
      server: true,
      load_pref: true,
      load_data: true,
      check_page: false,
      check_post: false,
      check_thread: false,
      import_format: 'obj', // radiobutton
      max_graph: 576, // radiobutton
      scale_thread: 10,
      auto_start: true,
      workaround_for_dollchan: false,
      prevent_redirection: false,
      graph_animation: false,
      autoconf: 'auto',
      info_server: false,
      info_client: false,
      debug_mode : {0:false, unread_count:'', 2:false, 3:false, 4:false, 5:false, parse_error:false, 7:false, site2func:'', site2func_expand:true, pfunc:'', pfunc_expand: true, pfunc_all:'', pfunc_all_expand: true, 9:false, 10:false, 11:false, 12:false, 13:false, 14:false},
      wafd_tb: 'tb',
      wafd_open_spoiler: false,
      show_page_fraction : true,
      catalog_max_page: 5,
      catalog_max_page_auto: false,
      catalog_snoop_refresh: true,
      catalog_auto_rollup_when_moving: true,
      catalog_size_width: 240,
      catalog_size_height: 350,
      catalog_size_text_width: 400,
      catalog_size_text_height: 16,
      catalog_size_tn_resize: true,
      catalog_size_tn1_width: 240,
      catalog_size_tn1_height: 240,
      catalog_size_tn2_width: 80,
      catalog_size_tn2_height: 80,
      catalog_size_frame0_width: 30,
      catalog_size_frame1_width: 69,
//      catalog_enable_cross_board: true,
//      catalog_enable_cross_domain: true,
      catalog_draw_on_demand: false,
      catalog_load_on_demand: false,
      catalog_2nd_images_show: false,
      catalog_2nd_images_hover: true,
      catalog_2nd_images_search: true,
      catalog_posts_on_demand: true,
      catalog_refresh_clear: true,
//      catalog_checkbox_deletion_show: false,
//      catalog_checkbox_deletion_hover: true,
//      catalog_checkbox_deletion_search: true,
      catalog_popup: true,
      catalog_popdown: 'delay',
      catalog_popup_delay: 300,
      catalog_popdown_delay: 500,
      catalog_popup_size_fix: true,
      catalog_click: 'none',
      catalog_click_area: 'thumbnail',
      catalog_open_last50: 'exist_watch',
      catalog_board_list_str: '//sample of board group\n' +
//        '//board_name[,nickname+board_name[+thread No.] | \'*\'+up to X page | \'^\'+style]...\n'+
        '//board_name[,nickname+board_name[+thread No.] | \'*\'+up to X page]...\n'+
        'Global/int/,8chan/int/,KC/int/,4chan/int/\n'+
        'Global/b/,8chan/b/,KC/b/,4chan/b/\n'+
        'v+gg,8chan/v/,8chan/gamergatehq/,4chan/v/\n'+
        'Inter/pol/,8chan/pol/,4chan/pol/\n'+
        'JapanShoppingMall,8chan/jpck/,8chan/japan2/\n',
//        'ScriptHome,8chan/scriptcdc/,KC/jp/35003\n',
//        'script_home,8chan/scriptcdc/,KC/jp/35003,KC/kc/41434\n',
      catalog_board_list_obj: [],
      catalog_promiscuous: false,
      catalog_board_list_sel: 0,
//      catalog_sw_domain: 'https://8chan.co',
      localtime_offset : -(new Date().getTimezoneOffset()/60),
      catalog_localtime : true,
      catalog_format: {show:  {style:  true, contents:  true, layout:  true, posts: false, fileinfo: false, images_2nd: true},
                       hover: {style:  true, contents: false, layout: false, posts:  true, fileinfo:  true, images_2nd: true},
                       search:{style: false, contents: false, layout: false, posts:  true, fileinfo:  true, images_2nd: true}},
//      catalog_border_show : false,
//      catalog_border : '1px solid',
//      catalog_enable_background : false,
      catalog_footer : true,
      catalog_footer_br : true,
      catalog_footer_show_site_name : false,
      catalog_footer_show_board_name : true,
      catalog_footer_show_thread_no : false,
      catalog_footer_show_nof_rep_to_me : true,
      catalog_footer_show_nof_rep       : true,
      catalog_footer_ignore_my_own_posts : true,
      catalog_footer_show_flag : true,
      catalog_footer_show_page : true,
      catalog_footer_show_tag : true,
      catalog_footer_tag_letters : 3,
      catalog_footer_design : 'native',
      catalog_no_popup_at_expanded : true,
      catalog_open_in_new_tab : true,
      catalog_open_where : 'named',
      catalog_open_where_click : true,
//      catalog_use_named_window : true,
      catalog_triage : true,
      catalog_triage_place : 'topLeft',
      catalog_triage_hist : 16,
//      catalog_triage_str : '["background:#e5ecf9","background:#c3dcf9","background:#b8efc2",'+
//        '"background:#efedbe","background:#fbd5fb","background:#fac2c5"]// defalut\n' +
//        '//["background:#e5ecf9;border:none","background:#c3dcf9;border:1px solid #a3bcd9",'+
//        '"background:#b8efc2;border:1px solid #98cfa2","background:#efedbe;border:1px solid #cfcd9e",' +
//        '"background:#fbd5fb;border:1px solid #ebb5db","background:#fac2c5;border:1px solid #daa2a5"]// backgroud+border',
      catalog_triage_str: 'KILL,X,,TIME,v,,WATCH,W,,UNWATCH,UW,,UNDO,U,',
//      catalog_triage_str : '//default\n'+
//        'KILL,X,,KILL,X,background:#c3dcf9,KILL,X,background:#b8efc2,'+
//        'KILL,X,background:#efedbe,KILL,X,background:#fbd5fb,KILL,X,background:#fac2c5\n'+
//        'TIME,v,,TIME,v,background:#c3dcf9,TIME,v,background:#b8efc2,'+
//        'TIME,v,background:#efedbe,TIME,v,background:#fbd5fb,TIME,v,background:#fac2c5\n'+
//        'NONE,O,,NONE,O,background:#c3dcf9,NONE,O,background:#b8efc2,'+
//        'NONE,O,background:#efedbe,NONE,O,background:#fbd5fb,NONE,O,background:#fac2c5\n'+
//        'UNDO,U,,WATCH,Watch,,UNWATCH,UnWatch,\n'+
//        '// sample\n'+
//        '//KILL,back_to_default,,NONE,border,background:#c3dcf9;border:3px solid blue,NONE,transparent,background:,NONE,shrink,width:100px;height:100px\n'+
//        '//\n'+
//        '// 1st column :\n'+
//        '//   KILL : delete forever.\n'+
//        '//   TIME : delete until the thread gets new replies.\n'+
//        '//   NONE : just change its appearance.\n'+
//        '// 2nd column : strings in the button.\n'+
//        '// 3rd column : style in HTML.\n'+
//        '// Repeat these as you wish.\n',
//        'KILL,'\u2715',,TIME,'\u2713',,NONE,'O',
      catalog_cross_domain_connection : 'indirect',
      catalog_auto_update : false,
      catalog_auto_update_period : 10,
      catalog_auto_update_countdown : true,
//      catalog_show_setting : false,
      catalog_t2h_num_of_posts : 5,
      catalog_expand_at_initial : false,
      catalog_expand_at_initial_embed : true,
      catalog_expand_with_hr : false,
      overwrite_site2_json_str: '//{"site2":{"KC":{"time_offset":2}}} // summer time for KC.',
      overwrite_site2_eval_str: '',
//      show_tooltip : true,
      tooltip: {show: true, popup_delay:2000, popdown_delay:1000},
      catalog: {
        indexing: 0,
//        max_threads : 512,
        max_threads_at_refresh : 500,
        filter: {
//          show : false,
          kwd : {use: false, str: '', re: false, ci: true, match: 0, op: true, post: false, sub: true, name: true, trip: false, com: true, file: false, kwds: []},
          scan_clear_auto : true,
          tag      : false,
//          tag_list_str : '',
//          tag_scan_auto : false,
          tag_ci   : false,
          time     : false,
          time_str : new Date().toLocaleString(),
//          time_ago_str : '24:00',
          time_ago_str : '0:00',
          time_ago_str_sync_at_refresh : false,
          time_track : false,
          time_mark : false,
          desktopime_mark_str : '',
          time_watch : false,
          time_watch_creation : false,
          list_time_scroll: true,
          list : true,
          list_mark_time : true,
          list_str : '',
//          list_obj : [],
          list_obj2 : {},
          attr_list : true,
          attr_list_str : '',
          attr_list_obj2 : {},
          bookmark_list : true,
          bookmark_list_str : '',
          bookmark_list_obj2 : {},
          watch_list_str : '',
          watch_list_obj2 : {},
          watch_list_mark_time : true,
          bookmark_list_rm404 : true,
          tag_scansite : true,
          tag_filter_str: '',
        },
        auto_load_filter : false,
        auto_save_filter : false,
        tag : {ignore:12, max:12},
        board: {recommendation: true, board_tags: false, ex_list: false, ex_list_str: '', ex_list_obj2: {}, board_tags_same: false},
        style_general_list : true,
        style_general_list_str : 
          '//^background:#e5ecf9\n'+
          '//^border:1px solid black\n'+
          '//8chan^background:#eef2ff;border:1px solid #d6daf0\n'+
          '//8chan^background:#eef2ff\n'+
          '//KC^background:#e0e0fc;border:1px solid #aaaacc\n'+
          '//4chan^background:#ffffee;border:1px solid #f0e0d6\n',
        style_general_list_obj2 : {},
        refresh : {initial : true, except_bt : true, at_switch: true},
        on_bt_page : false,
        design : 'auto',
        catalog_json : true,
        embed : true,
        embed_page : false,
        embed_frame : true,
//        order : {reply_to_me: true, reply: true, watch: 'dont_care', sticky:'dont_care', find_sage_in_8chan: false},
        order : {reply_to_me: true, reply: true, watch: 'dont_care', sticky:'dont_care'},
        health_indicator: {on: true, max:10},
        auto_watch: true,
        unmark_on_hover: true,
        mimic_base_site: true,
        text_mode: {mode:'graphic', sub:true, name:false, com:true},
        appearance: {
          titleBar: {filter: true, settings: true, refresh: true, num_of_pages: true, boards_selector: true},
          initial: {state: 'maximized', width: 400, height: 400}
        },
        footer: {ctime:false, btime:false, ptime:false},
      },
//      graph : {key: null, pipe: null},
      uip_tracker: {on : false, posts: true, deletion: true, interval: 10, adaptive: true, auto_open:false, auto_open_th:300, auto_open_kwd:''},
      thread_reader: {use: true, sync: true, triage: true, triage_close: true, check_num_of_children: true,
        own_posts_tracker: false, show_own_post_by: 'anchor', show_reply_to_me_by: 'anchor', clean_up_own_posts: true},
      settings: {indexing: 0},
      tag : {gen: false, gen_str:''}, // dummy for checkbox and textarea.
      cloudflare: {auto_reload: true, auto_reload_time: 5},
      scan: {max:10000, lifetime:20, crawler:50, max_threads:1000, crawler_adaptive:true, crawler_idle_time_to_spawn:100},
      notify : {sound: {notify: false, file:'', src:'beep', beep_freq:1000, beep_length_f:0.2, beep_volume_f:1, reply_to_me: true, reply: true, new_thread: true, appear: true},
                desktop: {notify: true, reply_to_me: true, reply: true, new_thread:true, appear:true, lifetime:30, show_last:false, limit:30},
                favicon: true,
                title: {notify:true, hide_zero: true},
               },
      liveTag: {
        use: true, max: 12, maxstr: 25, from:'post', lock_tags_in_op: true, ci: true,
        inherit_board_name: true, lock_board_name: true, inherit_board_tags: true, lock_board_tags: true,
        show_info_onmouseover: true, style: true,
        style_urtm_str:'color:lime;font-weight:bold', style_ur_str:'color:limegreen;font-weight:bold', style_in_str:'color:red',
        style_urtm_obj4:{},                           style_ur_obj4:{},                                style_in_obj4:{},
        pickup_interval: 10, rm_404_immediately: true, disp_delay:{fg:500, bg:5000}, click_func: 'in',
        watch_all: true, utilize_boards_json:true,
        ex_list: true, ex_list_str:'8chan:#selection\n', ex_list_obj5:[],
        rm_list: true, rm_list_str:'http*\n', rm_list_obj5:[]},
      virtualBoard: {
        show: true, max:20, scan: false, scanDelay: 5, p_board: 'replace', p_remove: false},
      page: {popup:true, popup_native:true, colorID:true, colorID_native:true, backlink:true, backlink_native:true,
             infinite: false, scan_tag:true},
      test_mode: {tips:false, num:0},
      patch: {delayed_invoke: {
                use: brwsr.ff && window.location.href.indexOf('4chan.org')!=-1,
                sec: 10}},
      pref2: {
        KC: {summer_time: false},
      }
    };
    for (i=0;i<30;i++) pref_new.test_mode[i] = false;
//    if (site && site2[site.nickname].pref_default) site2[site.nickname].pref_default(pref_new);
    if (site && site2[site.nickname].pref_default) pref_func.pref_overwrite(pref_new,site2[site.nickname].pref_default);
    return pref_new;
  }

  var cataLog = {
    threads: null,
    insert_footer3: null,
    catalog_liveTag_scan_threads: null,
    scan_boards: null,
    scan_init: null,
    catalog_filter_query: null,
    catalog_refresh_watch: null,
  }

  var pref_func = (function(){
//    var tooltip = document.createElement('div');
//    var tooltip_txt = tooltip.appendChild(document.createTextNode('help'));
////    var tooltip_txt = tooltip.appendChild(document.createElement('textarea'));
//    tooltip.style.position = 'fixed';
//    tooltip.style.background = '#e5f4f9';
//    tooltip.style.color = '#000000';
//    tooltip.style.border = '2px solid blue';
//    tooltip.style.fontWeight = 'normal';
//    var tooltip_on = false;
    return {
      mirror_targets: {
        pn12_0_2: null,
        pn12_0_4: null,
        pn13_1: null,
      },
      style_sheet: null,
      apply_prep: function(pn,set,propagate,mirror){
        if (!pn) return; // patch for attr_changed.
        var fm;
        if (!mirror) {
          fm = Array.prototype.slice.call(pn.getElementsByTagName('input'));
          fm = fm.concat(Array.prototype.slice.call(pn.getElementsByTagName('textarea')));
          fm = fm.concat(Array.prototype.slice.call(pn.getElementsByTagName('select')));
//          var fm = pn.getElementsByTagName('*'); // this doesn't work because a select contains its options in it.
          if (fm.length==0) fm = [pn];
        } else {
          fm = [];
          for (var j in this.mirror_targets) {
            if (this.mirror_targets[j]) {
              var fm_tmp = this.mirror_targets[j].getElementsByTagName('input')[pn.name];
              if (fm_tmp)
                if (Array.isArray(fm_tmp)) fm = fm.concat(Array.prototype.slice.call(fm_tmp));
                else fm[fm.length] = fm_tmp;
            }
          }
          for (var j=fm.length-1;j>=0;j--) if (fm[j]===pn) fm.splice(j,1);
          if (fm.length==0) return;
        }
        for (var i=0;i<fm.length;i++) {
          if (!fm[i].name) continue;
          if (fm[i].type=='button') continue;
          var target_hier = pref_func.get_tgt(fm[i].name);
          var parent = target_hier[0];
          var tgt    = target_hier[1];
//          var parent = pref;
//          var tgt = fm[i].name;
//          if (tgt.indexOf('.')!=-1) {
//            var tgts = tgt.split('.');
//            for (var j=0;j<tgts.length-1;j++) parent = parent[tgts[j]];
//            tgt = tgts[tgts.length-1];
//          }
          if (fm[i].tagName==='INPUT') {
            if (set) {
              if      (typeof(parent[tgt])==='number' ) {
                if (fm[i].name.substr(-2,2)==='_f') parent[tgt] = (isNaN(parseFloat(fm[i].value)))? 0 : parseFloat(fm[i].value);
                else                                parent[tgt] = (isNaN(parseInt(fm[i].value,10)))? 0 : parseInt(fm[i].value,10);
              } else if (typeof(parent[tgt])==='boolean') parent[tgt] = fm[i].checked;
              else if (typeof(parent[tgt])==='string' ) {
                if (fm[i].type==='text'|| fm[i].checked) parent[tgt] = fm[i].value;
                if (fm[i].type==='text')
                  if (tgt.substr(-3,3)==='str' && parent[tgt.substr(0,tgt.length-3)+'obj4']) pref_func.str2obj4(parent,tgt.substr(0,tgt.length-3)+'obj4',fm[i].value);
              }
              if (!mirror) this.apply_prep(fm[i],false,false,true); // !mirror for safety.
            } else {
              if      (typeof(parent[tgt])=='number' ) fm[i].value = parent[tgt];
              else if (typeof(parent[tgt])=='boolean') fm[i].checked = parent[tgt];
              else if (typeof(parent[tgt])=='string' ) if (fm[i].type==='text') fm[i].value = parent[tgt]; else if (parent[tgt] === fm[i].value) fm[i].checked = true;
            }
            if (fm[i].type==='file' && !set) {
              if (pref_func.settings.files_pool[fm[i].name]) {
                fm[i].parentNode.insertBefore(pref_func.settings.files_pool[fm[i].name],fm[i]);
                delete pref_func.settings.files_pool[fm[i].name];
                fm[i].parentNode.removeChild(fm[i]);
              }
            }
          }
          if (fm[i].tagName==='TEXTAREA') {
            if (set) {
              parent[tgt] = fm[i].value;
              if (tgt.search(/str$/)!=-1 && parent[tgt.replace(/str$/,'obj')]) pref_func.str2obj(tgt);
              if (tgt.search(/str$/)!=-1 && parent[tgt.replace(/str$/,'obj2')]) pref_func.str2obj2(parent,tgt.replace(/str$/,'obj2'),fm[i].value);
//              if (tgt.substr(-3,3)==='str' && parent[tgt.substr(0,tgt.length-3)+'obj4']) pref_func.str2obj4(parent,tgt.substr(0,tgt.length-3)+'obj4',fm[i].value);
              if (tgt.substr(-3,3)==='str' && parent[tgt.substr(0,tgt.length-3)+'obj5']) pref_func.str2obj5(parent,tgt.substr(0,tgt.length-3)+'obj5',fm[i].value);
            } else fm[i].value = parent[tgt];
          }
          if (fm[i].tagName==='SELECT') {
            if (set) parent[tgt] = fm[i].selectedIndex;
            else {
              var tgt_obj = (tgt.search(/sel/)!=-1)? tgt.replace(/sel/,'obj') : null;
              if (parent[tgt_obj]) {
                fm[i].length=0;
                for (var j=0;j<parent[tgt_obj].length;j++) {
                  fm[i].length++;
                  fm[i].options[fm[i].length-1].text = parent[tgt_obj][j][0]['key'];
                }
              }
              if (parent[tgt]>=fm[i].length) parent[tgt] = 0;
              fm[i].selectedIndex = parent[tgt];
            }
          }
          if (propagate && fm[i].onchange) fm[i].onchange.call(fm[i]);
        }
        if (sessionStorage && set) sessionStorage.pref = JSON.stringify(pref);
      },
      make_pref_obj : function(name){ // copy of part of apply_prep.
        var target_hier = pref_func.get_tgt(name);
        var parent = target_hier[0];
        var tgt    = target_hier[1];
        if (tgt.search(/str$/)!=-1 && parent[tgt.replace(/str$/,'obj')]) pref_func.str2obj(tgt);
        if (tgt.search(/str$/)!=-1 && parent[tgt.replace(/str$/,'obj2')]) pref_func.str2obj2(parent,tgt.replace(/str$/,'obj2'),parent[tgt]);
      },
      board_sel : null,
      catalog_board_list_str_or: '',
      catalog_board_list_str_bt: '',
      catalog_board_list_str_bt_same: '',
//      add_onchange: function(pn,func){
//        var fm = pn.getElementsByTagName('*');
//        if (fm.length==0) fm = [pn];
//        for (var i=0;i<fm.length;i++) {
//          if (!fm[i].name) continue;
//          if (fm[i].tagName==='INPUT' || fm[i].tagName==='TEXTAREA' || fm[i].tagName==='SELECT') fm[i].onchange = func;
//          if (fm[i].tagName==='BUTTON') fm[i].onclick = func;
//        }
//      },
      add_onchange: function(pn,func_obj){
        var call_tgt = func_obj;
        if (typeof(func_obj)!=='function') { // object
          for (var i in func_obj) if (typeof(func_obj[i])==='string') func_obj[i] = func_obj[func_obj[i]];
//          func_obj.func_default = function(){ // cause EventListener leak.
//            pref_func.apply_prep(this,true);
//            if (func_obj[this.name]) func_obj[this.name](this);
//          };
//          call_tgt = func_obj.func_default;
          call_tgt = func_obj.entry_func;
        }
        this.set_event_target(pn,call_tgt);
      },
      set_event_target: function(pn,tgt){
        var fm = pn.getElementsByTagName('*');
        if (fm.length==0) fm = [pn];
        for (var i=0;i<fm.length;i++) {
          if (!fm[i].name) continue;
          if (fm[i].tagName==='INPUT' || fm[i].tagName==='TEXTAREA' || fm[i].tagName==='SELECT') fm[i].onchange = tgt; // leaks 1 EventListener
          if (fm[i].tagName==='BUTTON') fm[i].onclick = tgt; // OK.
        }
      },
      remove_onchange: function(pn){this.set_event_target(pn,null);},
//      invoke_onchange: function(pn){
//        var evt = document.createEvent('UIEvents');
//        evt.initUIEvent('change', false, true, window, 1);
//        pn.dispatchEvent(evt);
//      },
      str2obj: function(key) {
//        var tgt = key+'_obj';
        var tgt = key.replace(/str$/,'obj');
        pref[tgt] = [];
        tgt = pref[tgt];
//        var lines = pref[key].split('\n');
//        lines.splice(0,0,(!pref.catalog.on_bt_page)? site.board+','+site.nickname+site.board : site2[site.nickname].boards_sel_from_tags());
        var bg_str = '';
        bg_str = bg_str + ((!pref.catalog.on_bt_page)? site.board+','+site.nickname+site.board : site2[site.nickname].boards_sel_from_tags()) + '\n';
        bg_str = bg_str + pref[key] + '\n';
        if (pref.catalog.board.recommendation) {
//          var blotter = document.getElementsByClassName('blotter')[0];
//          if (blotter) {
//            or_str = document.getElementsByClassName('blotter')[0][brwsr.innerText];
//            var kwd = 'Recommendation: ';
//            var idx = or_str.indexOf(kwd);
//            if (idx!=-1) {
//              var or = or_str.substr(idx+kwd.length);
//              pref_func.catalog_board_list_str_or = or;
//              lines.push(or);
//            }
//          }
          var or = site2[site.nickname].get_owners_recommendation();
          pref_func.catalog_board_list_str_or = or;
//          lines.push(or);
          bg_str = bg_str + or + '\n';
        }
//        if (pref.catalog.board.board_tags && pref_func.catalog_board_list_str_bt!=='') lines.push(pref_func.catalog_board_list_str_bt);
//        if (pref.catalog.board.board_tags_same && pref_func.catalog_board_list_str_bt_same!=='') lines.push(pref_func.catalog_board_list_str_bt_same);
        if (pref.catalog.board.board_tags && pref_func.catalog_board_list_str_bt!=='') bg_str = bg_str + pref_func.catalog_board_list_str_bt + '\n';
        if (pref.catalog.board.board_tags_same && pref_func.catalog_board_list_str_bt_same!=='') bg_str = bg_str + pref_func.catalog_board_list_str_bt_same + '\n';
        var lines = bg_str.split('\n');
        var bn = -1;
        for (var i=0;i<lines.length;i++) {
          var fields = lines[i].replace(/\/\/.*/,'').replace(/, +/g,',').split(',');
          var j=0;
          while (j<fields.length && fields[j]=='') j++;
          if (fields[j]) {
            tgt[++bn] = [];
            tgt[bn][0] = {};
            tgt[bn][0].key = fields[j++];
            var idx=0;
            while (j<fields.length) {
              if (fields[j]!==''){
                tgt[bn][++idx] = {};
                tgt[bn][idx].key = fields[j].replace(/[\*\^!].*/,'');
                if (fields[j].search(/\*/)!=-1) tgt[bn][idx]['num'   ] = fields[j].replace(/[^\*\^!]*[\*\^!]/,'').replace(/[\^!].*/,'');
                if (fields[j].search(/\^/)!=-1) tgt[bn][idx]['style' ] = fields[j].replace(/[^\*\^!]*[\*\^!]/,'').replace(/[\*!].*/,'');
                if (fields[j].search(/\!/)!=-1) tgt[bn][idx]['search'] = fields[j].replace(/[^\*\^!]*[\*\^!]/,'').replace(/[\*\^].*/,'');
//                tgt[bn][idx].key = fields[j].replace(/[\*%!].*/,''); // working code..., but '%' is used in URL...
//                if (fields[j].search(/\*/)!=-1) tgt[bn][idx]['num'   ] = fields[j].replace(/[^\*%!]*[\*%!]/,'').replace(/[%!].*/,'');
//                if (fields[j].search(/\%/)!=-1) tgt[bn][idx]['style' ] = fields[j].replace(/[^\*%!]*[\*%!]/,'').replace(/[\*!].*/,'');
//                if (fields[j].search(/\!/)!=-1) tgt[bn][idx]['search'] = fields[j].replace(/[^\*%!]*[\*%!]/,'').replace(/[\*%].*/,'');
              }
              j++;
            }
          }
        }
        for (var i=0;i<tgt.length;i++) {
          for (var j=1;j<tgt[i].length;j++) {
            var dm = tgt[i][j].key.replace(/\/.*/,'');
            if (dm=='') dm=site.nickname;
            var bd = '/'+ tgt[i][j].key.replace(/[^\/]*\//,'').replace(/\/.*/,'') +'/';
            if (j==1) {
              tgt[i][0]['domain']= dm;
              tgt[i][0]['board' ]= bd;
            } else {
              if (tgt[i][0]['domain']!=dm) tgt[i][0]['domain']=null;
              if (tgt[i][0]['board' ]!=bd) tgt[i][0]['board' ]=null;
            }
          }
        }
      },
      get_tgt: function(name){
        var parent = (name[0]==='#')? liveTag.tags : pref;
        var tgt = name;
        if (tgt.indexOf('.')!=-1) {
          var tgts = tgt.split('.');
          for (var j=0;j<tgts.length-1;j++) parent = parent[tgts[j]];
          tgt = tgts[tgts.length-1];
        }
        return [parent,tgt];
      },
      str2obj2: (function(){
        function set_vals(tgt,key,vals_in){
          if (vals_in) {
            if (!tgt[key]) tgt[key] = {};
            var vals = vals_in[0].substr(1).split(';');
            for (var j=0;j<vals.length;j++) {
              var val = vals[j].split(':');
              if (val[1]==='false') val[1] = false;
              tgt[key][val[0]] = val[1];
            }
          }
        }
        return function(parent,key,str){
          parent[key] = {};
          tgt = parent[key];
          var fields = str.replace(/\/\/.*/mg,'').replace(/\n/g,',').split(',');
          for (var i=0;i<fields.length;i++) {
            if (fields[i]=='') continue;
            var name = fields[i].replace(/[@\^!].*/,'') || 'DEFAULT';
            if (tgt[name]===undefined) tgt[name] = {};
            var time = fields[i].match(/@[^\^!]*/);
            if (time) tgt[name].time = Date.parse(time[0].replace(/@/,''));
            set_vals(tgt[name],'style',fields[i].match(/\^[^@!]*/));
            set_vals(tgt[name],'cmd'  ,fields[i].match(/![^@\^]*/));
          }
          var key3 = key.replace(/_obj2/,'_obj3');
          parent[key3] = {};
          var tgt3 = parent[key3];
          for (var i in tgt) tgt3[i.replace(/\/[0-9]+$/,'/')] = true;
        }
      })(),
////      str2obj2: function(parent,key,str){ // working code.
////        parent[key] = {};
////        tgt = parent[key];
////        var fields = str.replace(/\/\/.*/mg,'').replace(/\n/g,',').split(',');
////        for (var i=0;i<fields.length;i++) {
////          if (fields[i]=='') continue;
////          var name  = fields[i].replace(/[@%].*/,'');
////          if (name=='') name = 'DEFAULT';
////          var attr  = fields[i].match(/[@%].*/);
////          var time  = (attr!=null)? attr[0].replace(/%[^@]*(@|$)/,'').replace(/@/,'') : null;
////          var style = (attr!=null)? attr[0].replace(/@[^%]*(%|$)/,'').replace(/%/,'') : null;
////          if (tgt[name]===undefined) tgt[name] = {};
////          if (time ) tgt[name]['time']  = Date.parse(time);
//////          if (style) tgt[name]['style'] = style;
////          if (style) {
////            if (!tgt[name].style) tgt[name].style = {};
////            var styles = style.split(';');
////            for (var j=0;j<styles.length;j++) {
////              var stl = styles[j].split(':');
////              tgt[name].style[stl[0]] = stl[1];
////            }
//////            tgt[name]['style'] = true;
//////            var styles = style.split(';');
//////            for (var j=0;j<styles.length;j++) {
//////              var stl = styles[j].split(':');
//////              tgt[name]['style.'+stl[0]] = stl[1];
//////            }
////          }
////        }
////        var key3 = key.replace(/_obj2/,'_obj3');
////        parent[key3] = {};
////        var tgt3 = parent[key3];
////        for (var i in tgt) tgt3[i.replace(/\/[0-9]+$/,'/')] = true;
////      },
      str2obj4: function(parent,key,str) {
        parent[key] = this.style2obj(str);
      },
      style2obj: function(str) {
        var fields  = str.split(';');
        for (var i=fields.length-1;i>=0;i--) {
          if (fields[i]) {
            var coms = fields[i].replace(/\s/g,'').split(':');
            fields[i] = '"'+coms[0]+'":"'+coms[1]+'"';
          } else fields.splice(i,1);
        }
        return JSON.parse('{' + fields.join(',') + '}');
      },
      str2obj5: function(parent,key,str){
        parent[key] = {};
        tgt = parent[key];
        var fields = str.replace(/\/\/.*/mg,'').replace(/\n/g,',').split(',');
        for (var i=0;i<fields.length;i++) {
          if (fields[i]=='') continue;
          var idx = fields[i].indexOf(':'); // tags never contains ':'
          var name = (idx!=-1)? fields[i].substr(0,idx) : 'DEFAULT';
          if (tgt[name]===undefined) tgt[name] = [];
          tgt[name][tgt[name].length] = (fields[i][idx+1]==='/')? new RegExp(fields[i].substr(idx+2,fields[i].lastIndexOf('/')-idx-2),fields[i].substr(fields[i].lastIndexOf('/')+1)) :
                                        (key==='ex_list_obj5')? new RegExp(fields[i].substr(idx+1).replace(/\*/g,'.*')) :
                                                                new RegExp(fields[i].substr(idx+1).replace(/\*/g,'\\S*(\\s|$)'),'g');
//          tgt[name][tgt[name].length] = new RegExp('#'+(fields[i][idx]==='/')? fields[i].substr(idx+1) :
//                                                                               fields[i].substr(idx+1).replace(/\*/,'.*'));
        }
      },
      merge_obj5: function(name,obj,val){
        var dbt = common_func.fullname2dbt(name);
        val = this.merge_obj5_1(val,obj,'DEFAULT');
        val = this.merge_obj5_1(val,obj,dbt[0]); // domain
        val = this.merge_obj5_1(val,obj,dbt[1]); // board
        val = this.merge_obj5_1(val,obj,dbt[0]+dbt[1]); // domain+board
        val = this.merge_obj5_1(val,obj,dbt[2]); // thread
        val = this.merge_obj5_1(val,obj,dbt[0]+dbt[2]); // domain+thread
        val = this.merge_obj5_1(val,obj,dbt[1]+dbt[2]); // board+thread
        val = this.merge_obj5_1(val,obj,name);
        return val;
      },
      merge_obj5_1: function(val,obj,key){
        if (obj[key]) {
          if (Array.isArray(obj[key])) val = obj[key].concat(val || []);
          else {
            if (!val) val = {};
            if (val.hit!==undefined) val.hit = true;
            for (var i in obj[key])
              if (typeof(obj[key][i])!=='object') val[i] = obj[key][i];
              else {
                if (val[i]===undefined) val[i]={};
                for (var j in obj[key][i]) val[i][j] = obj[key][i][j]; // 2nd level.
              }
          }
        }
        return val;
      },
      obj_init: function(){
        pref_func.str2obj('catalog_board_list_str');
        pref_func.str2obj2(pref.catalog,'style_general_list_obj2',pref.catalog.style_general_list_str);
        pref_func.str2obj2(pref.catalog.board,'ex_list_obj2',pref.catalog.board.ex_list_str);
        pref_func.str2obj4(pref.liveTag, 'style_urtm_obj4', pref.liveTag.style_urtm_str);
        pref_func.str2obj4(pref.liveTag, 'style_ur_obj4',   pref.liveTag.style_ur_str);
        pref_func.str2obj4(pref.liveTag, 'style_in_obj4',   pref.liveTag.style_in_str);
        pref_func.str2obj5(pref.liveTag, 'ex_list_obj5',    pref.liveTag.ex_list_str);
        pref_func.str2obj5(pref.liveTag, 'rm_list_obj5',    pref.liveTag.rm_list_str);
      },
      obj_elim_the_same: function(dst,src, not_root){
        var flag = true;
        for (var i in dst) {
          if (typeof(dst[i])==='object' && src[i] && typeof(src[i])==='object') { // eliminates objects made by program automatically because original object are vacant.
            if (pref_func.obj_elim_the_same(dst[i],src[i],true)) delete dst[i];
            else flag = false;
          } else {
            if (dst[i]===src[i]) delete dst[i];
            else {dst[i]=src[i];flag = false;}
          }
        }
        return (not_root)? flag : dst;
      },
      site2_json_ex: function(full){
        var pref_test = pref_default();
        pref_func.obj_elim_the_same(pref_test,pref);
        if (!full) { 
          if (pref_test.catalog.filter) delete pref_test.catalog.filter;
          if (pref_test.catalog_board_list_str) delete pref_test.catalog_board_list_str;
          if (pref_test.catalog_board_list_obj) delete pref_test.catalog_board_list_obj;
        }
        if (pref_test.settings) delete pref_test.settings;
//        if (pref_test.graph) delete pref_test.graph;
        if (pref_test.overwrite_site2_json_str) delete pref_test.overwrite_site2_json_str;
        pref.overwrite_site2_json_str = '{"pref":' + JSON.stringify(pref_test) + '}';
      },
      pref_overwrite: function(dst,src,strict){
        for (var i in src)
          if (dst[i]!==undefined) {
            if (strict && typeof(src[i])!==typeof(dst[i])) continue;
            if (typeof(src[i])==='object' && !Array.isArray(src[i])) pref_func.pref_overwrite(dst[i],src[i],strict);
            else dst[i] = src[i];
          }
      },
      pref_query: function(ref,src){
        var str = '';
        for (var i in src) {
          if (ref[i]!==undefined) {
            str += '"' + i + '":' +
                   ((typeof(src[i])==='object' && !Array.isArray(src[i]))? pref_func.pref_query(ref[i],src[i]) :
                                                                           JSON.stringify(ref[i]))
                 + ',';
          }
        }
        return '{' + str.substr(0,str.length-1) + '}';
      },
      site2_json: function(query, disable_others, disable_site3){
        var pn_out = document.getElementsByName('JSON_result')[0];
        if (pn_out) pn_out.style = {};
        try { 
          if (pref.overwrite_site2_json_str!=='') {
            var fields = pref.overwrite_site2_json_str.split('"');
            var i=0;
            while (i<fields.length) {
              if (fields[i].search(/\/\/.*/)!=-1) {
                while (i+1<fields.length && fields[i].search(/\/\/[^\n]*\n/)==-1) fields[i] += fields.splice(i+1,1);
                fields[i] = fields[i].replace(/\/\/[^\n]*(\n|$)/,'');
              } else i+=2;
            }
            var str = fields.join('"');
            var ex_count = 0;
            var str_out = '';
            var count = 0;
            var start = 0;
            for (var j=0;j<str.length;j++) { // can handle multiple JSON.
              if (count==0 && str[j]!=='{' && str[j]!==' ' && str[j]!=='\n') ex_count++;
              if (str[j]==='{') count++;
              if (str[j]==='}' && --count==0) {
                var obj = JSON.parse(str.substr(start,j-start+1))
                for (var i in obj)
                  if ((!disable_others && (i==='site2' || i==='pref' || i==='pref_func' || i=='liveTag')) || (!disable_site3 && i==='site3'))
                    if (!query) pref_func.pref_overwrite(eval(i),obj[i]);
                    else str_out = '{"' + i + '":' + pref_func.pref_query(eval(i),obj[i]) + '}';
                start = j+1;
              }
            }

//            if (str!=='') { // working code.
//            if (str.indexOf('{')!=-1) {
//              var obj = JSON.parse(str);
//              for (var i in obj)
//                if (i==='site2' || i==='pref' || i==='pref_func') pref_func.pref_overwrite(eval(i),obj[i]);
//            }
////          if (pref.overwrite_site2_json_str!=='') { // working code
//////            var str = pref.overwrite_site2_json_str.replace(/\/\/.*/mg,'').replace(/\n/g,'');
////            var fields = pref.overwrite_site2_json_str.split('"');
////            for (var i=0;i<fields.length;i+=2) {
////              if (fields[i].search(/\/\/.*/)!=-1) {
////                if (fields[i].search(/\n/)!=-1 || i+1==fields.length) fields[i] = fields[i].replace(/\/\/[^\n]*(\n|$)/,'');
////                else {
//////                  while (i+1<fields.length && fields[i].search(/\n/)==-1) fields[i++]='';
////                  while (i+1<fields.length && fields[i].search(/\n/)==-1) fields.splice(i,1);
////                  if (i<fields.length) fields[i] = fields[i].replace(/[^\n]*(\n|$)/,'');
////                }
////              }
////            }
////            var str = fields.join('"');
////            var count = 0;
////            var start = 0;
////            for (var j=0;j<str.length;j++) {
////              if (str[j]==='{') count++;
////              if (str[j]==='}') {
////                count--;
////                if (count==0) {
////                  var str_tmp = str.substr(start,j-start+1);
////                  if (str_tmp!=='') {
////                    var obj = JSON.parse(str_tmp);
////                    for (var i in obj)
////                      if (i==='site2' || i==='pref' || i==='pref_func') pref_func.pref_overwrite(eval(i),obj[i]);
////                  }
////                  start = j+1;
////                }
////              }
////            }
//////            if (str!=='') pref_func.pref_overwrite(site2,JSON.parse(str));
//////            if (str!=='') {
//////              var obj = JSON.parse(str);
//////              for (var i in obj)
//////                if (i==='site2' || i==='pref' || i==='pref_func') pref_func.pref_overwrite(eval(i),obj[i]);
//////            }
            if (pn_out) {
              pn_out.textContent = ((ex_count!=0)? 'OK, but there are extra useless strings, ' :
                                    (count!=0)? 'OK, but there are non-closed brackets, ' :
                                    'OK, ') + new Date().toLocaleString();
              pn_out.style.color = '';
              if (str_out!=='') {
                document.getElementsByName('overwrite_site2_json_str')[0].value = str_out;
                pref.overwrite_site2_json_str = str_out;
              }
            }
          }
        } catch (e) {
          if (pn_out) {
            pn_out.textContent = 'ERROR!!!, ' + new Date().toLocaleString();
            pn_out.style.color = 'red';
          }
          console.log('ERROR in overwtite strings:');
          console.log(pref.overwrite_site2_json_str);
          console.log(e);
        }
      },
      site2_eval: function(){
//        try { 
//          if (pref.overwrite_site2_eval_str!=='') eval(pref.overwrite_site2_eval_str);
//        } catch (e) {
//          console.log('ERROR in overwtite strings:');
//          console.log(pref.overwrite_site2_eval_str);
//          console.log(e);
//        }
      },
      tooltips: (function(){
        var tooltip = document.createElement('div');
        tooltip.style.position = 'fixed';
        tooltip.style.background = '#e5f4f9';
        tooltip.style.color = '#000000';
        tooltip.style.border = '2px solid blue';
        tooltip.style.fontWeight = 'normal';
        tooltip.style.zIndex = 1;
        var tooltip_on = null;
        var func = {};
        var show_timer = null;
        var hide_timer = null;
//        var str_tooltip = '';

        function add_hier(pn){
          var all = pn.getElementsByTagName('*');
          if (pref.test_mode.tips) for (var i=0;i<all.length;i++) if (!str[all[i].name]) str[all[i].name] = 'Name: ' + all[i].name;
          for (var i=0;i<all.length;i++) if (all[i].name) add(all[i]);
        }
        function remove_hier(pn){
          var all = pn.getElementsByTagName('*');
          for (var i=0;i<all.length;i++) if (all[i].name) remove(all[i]);
        }
        function add(elem){
          if (str.hasOwnProperty(elem.name)) {
            if (!func.hasOwnProperty(elem.name)) func[elem.name] = [];
            func[elem.name].push(elem);
            elem.addEventListener('mouseover', show, false);
          }
        }
        function remove(elem){
          if (func.hasOwnProperty(elem.name)) {
            var elems = func[elem.name];
            for (var i=0;i<elems.length;i++) {
              if (elem===elems[i]) {
                elem.removeEventListener('mouseover', show, false);
                elems.splice(i,1);
                if (elems.length==0) delete func[elem.name];
              }
            }
//            for (var i=0;i<elems.length;i++) {
//              var elem = func[elem.name][i];
//              elem.removeEventListener('mouseover', show, false);
//            }
//            delete func[elem.name];
          }
        }
//        function show(e){ // working code.
//          tooltip.style.left = e.clientX + 20 + 'px';
//          tooltip.style.top  = e.clientY + 20 + 'px';
//          var str_tooltip = null;
//          if (this.name===undefined) this.name = this.getAttribute('name');
//          for (var i in str_func) if (this.name.indexOf(i)==0) {
//            str_tooltip = str_func[i](this,e);
//            break;
//          }
//          if (str_tooltip===null) {
//            str_tooltip = (typeof(str[this.name])==='function')? str[this.name]() : str[this.name];
//            str_tooltip = str_tooltip.replace(/\n/mg,'<br>').replace(/  /g,'&emsp;');
//          }
//          tooltip.innerHTML = str_tooltip;
//          if (hide_timer!==null) {clearTimeout(hide_timer);hide_timer=null;}
//          if (tooltip_on) tooltip_on.removeEventListener('mouseout' ,hide, false);
//          else {
//            if (show_timer!==null) clearTimeout(show_timer);
//            show_timer = setTimeout(show_exe,pref.tooltip.popup_delay);
//          }
//          tooltip_on = this;
//          this.addEventListener('mouseout' , hide, false);
//        }
        function show(e){
          var str_tooltip = null;
          if (this.name===undefined) this.name = this.getAttribute('name');
////          for (var i in str_func) if (this.name.indexOf(i)==0) {
////            str_tooltip = str_func[i](this,e);
////            break;
////          }
          if (str_tooltip===null) {
            str_tooltip = (typeof(str[this.name])==='function')? str[this.name]() : str[this.name];
            str_tooltip = str_tooltip.replace(/\n/mg,'<br>').replace(/  /g,'&emsp;');
          }
          show_1.call(this,e,str_tooltip);
        }
        function show_1(e,str_tooltip){
          tooltip.style.left = e.clientX + 20 + 'px';
          tooltip.style.top  = e.clientY + 20 + 'px';
          tooltip.innerHTML = str_tooltip;
          if (hide_timer!==null) {clearTimeout(hide_timer);hide_timer=null;}
          if (tooltip_on) tooltip_on.removeEventListener('mouseout' ,hide, false);
          else {
            if (show_timer!==null) clearTimeout(show_timer);
            show_timer = setTimeout(show_exe,pref.tooltip.popup_delay);
          }
          tooltip_on = this;
          this.addEventListener('mouseout' , hide, false);
        }
        function show_exe(elem){
          site.root_body.appendChild(tooltip);
          show_timer = null;
        }
//        function show(e){
//          tooltip.style.left = e.clientX + 20 + 'px';
//          tooltip.style.top  = e.clientY + 20 + 'px';
//          tooltip.innerHTML = str[this.name].replace(/\n/mg,'<br>').replace(/  /g,'&emsp;');
//          if (!tooltip_on) site.root_body.appendChild(tooltip);
//          else {
//            if (hide_timer!==null) {clearTimeout(hide_timer);hide_timer=null;}
//            tooltip_on.removeEventListener('mouseout' ,hide, false);
//          }
//          tooltip_on = this;
//          this.addEventListener('mouseout' , hide, false);
//        }
        function hide(){ // called from both event and external function.
          if (hide_timer===null) hide_timer = setTimeout(hide_exe,pref.tooltip.popdown_delay);
        }
        function hide_exe(){
          if (tooltip_on) {
            if (show_timer===null) tooltip.parentNode.removeChild(tooltip);
            else {clearTimeout(show_timer);show_timer=null;}
            tooltip_on.removeEventListener('mouseout' ,hide, false);
            tooltip_on = null;
          }
          hide_timer = null;
        }
//        add_hier: function(pn){
//          var all = pn.getElementsByTagName('*');
////          for (var i=0;i<all.length;i++) if (!pref_func.tooltips.str[all[i].name]) pref_func.tooltips.str[all[i].name] = 'Name: ' + all[i].name;
//          for (var i=0;i<all.length;i++) if (all[i].name) pref_func.tooltips.add(all[i]);
//        },
//        remove_hier: function(pn){
//          var all = pn.getElementsByTagName('*');
//          for (var i=0;i<all.length;i++) if (all[i].name) pref_func.tooltips.remove(all[i]);
//        },
//        add: function(elem){
//          if (elem.name in pref_func.tooltips.str) {
//            if (!(elem.name in pref_func.tooltips.func)) pref_func.tooltips.func[elem.name] = [];
//            pref_func.tooltips.func[elem.name].push(elem);
//            elem.addEventListener('mouseover',pref_func.tooltips.show,false);
//            elem.addEventListener('mouseout' ,pref_func.tooltips.hide,false);
//          }
//        },
//        remove: function(elem){
//          if (pref_func.tooltips.func[elem.name]) {
//            var elems = pref_func.tooltips.func[elem.name];
//            for (var i=0;i<elems.length;i++) {
//              var elem = pref_func.tooltips.func[elem.name][i];
//              elem.removeEventListener('mouseover',pref_func.tooltips.show,false);
//              elem.removeEventListener('mouseout' ,pref_func.tooltips.hide,false);
//            }
//            delete pref_func.tooltips.func[elem.name];
//          }
//        },
//        show: function(e){
//          tooltip.style.left = e.clientX + 20 + 'px';
//          tooltip.style.top  = e.clientY + 20 + 'px';
//          tooltip.innerHTML = pref_func.tooltips.str[this.name].replace(/\n/mg,'<br>').replace(/  /g,'&emsp;');
//          if (!tooltip_on) site.root_body.appendChild(tooltip);
//          tooltip_on = this.name;
//        },
//        hide: function(){
//          if (tooltip_on) site.root_body.removeChild(tooltip);
//          tooltip_on = null;
//        },
////        var str_func = {
////          '#': function(sender,e){return liveTag.tooltip(sender,e);},
////        };
        var str = {
//          'pn_catalog_triage': 'hide forever, hide until new replies, watch, unwatch, undo.\n'+
//                               'You can customize this in settings -> Catalog: Appearance (in top selector) -> Style:',
////          'pn_catalog_triage': '1st row: Hide it forever.\n2nd row: Hide it now, but it will appear again when the thread gets new replies,\n' +
////            '  and new replies are marked.\n3rd row: Don\'t hide it, just change its appearance.\n' +
////            'Each column shows appearance the thread will get.\n' +
////            'Don\'t forget checking \'Exclusive list\' and \'Attribute list\' for using this function.\n' +
////            'In other words, you can appear it again by unckecking them.\nAnd you can configure these appearance in \'Attribute list\' and \'Triage styles\'.',
          'catalog_refresh_clear': 'Clear all threads at update.',
          'catalog_promiscuous': 'Gather information whatever.',
          'catalog.filter.kwd.re': 'Regular Expression.',
          'catalog.filter.kwd.ci': 'Case insensitive, don\'t distinguish uppercase and lowercase.',
          'catalog.filter.time': 'Time : show threads which have newer posts than the time.',
          'catalog.filter.time_mark': 'Mark: mark newer posts and scrool to them when it\'s opened.',
          'catalog.filter.time_watch': 'Watch: watch threads which have newer posts than the time.',
          'catalog.filter.time_watch_creation': 'Watch(creation time): watch threads which are created later than the time.',
          'catalog.filter.tag_filter_str': 'Filter string for tag. (Regular expression search) For reducing memory usage, you must type something at first, then tags will appear. If you want to show all tags, just type \'.\'',
          'catalog_cross_domain_connection': 'Use \'direct\' if you could, because it\'s quite light, but it doesn\'t work in almost of all environments.\n\'indirect\' usually works well.',
          'debug_mode' : 'Debug mode.',
          'show_tooltip' : 'Show this tooltip.',
          'liveTag.rm_list_str': function(){return this.TagExLists();},
          'liveTag.ex_list_str': function(){return this.TagExLists();},
          'TagExLists': function(){return 'String, ...  or\n/RegularExpression/, ... or \nIdentifier:String, ... or \nIdentifier:/RegularExpression/, ...\n'+
            '\nRegularExpression must be embraced by shashes.\n'+
            'String list is applied BEFORE extraction, so it costs more than tag list which is applied AFTER extraction. Regular expression in string list accepts flags, so don\'t forgot to add \'g\' flag for usual work, like /some_regexp/g, or it removes the first match only. You can remove both cases using \'i\' flag.\n'+this.GeneralRules;},
          'catalog_board_list_str': function(){return 'How to write \'Board groups\'.\n'+
            '\nName,Identifier, ...\n\n'+
            'First column is a name of board groups. The name is shown on the top right corner of catalog and become a key when you store its filter setting to local Storage.\n'+
            'Second or later columns are members. Each member is expressed by \'Identifier\'. Each line becomes each board groups.\n'+
            '\n'+ this.GeneralRules;},
          'GeneralRules': '\nDouble slash(//) is a beginning of comment.\n'+
            'Identifier:\n'+
            'Identifier is a string which contains domain, board and/or thread. You can omit some of them. When some identifiers are dropped, it\'ll be interpreted as follows. Upper case has the priority.\n'+
            '\n'+
            'domain/board/thread\n'+
            '/board/thread\n'+
            'domain/thread\n'+
            'thread\n'+
            'domain/board/\n'+
            '/board/\n'+
            'domain\n'+
            '\n'+
            '\'Board identifier\' must be expressed in a couple of slashes, like /int/. \'Thread identifier\' must be numeric. If the identifier is a word, it\'ll be treated as a \'Thread identifier\' if it is numeric, or it\'ll be a \'Domain identifier\'. '+
            'Domain identifiers must be one of lain, 4chan, 8chan or KC',
          'catalog.style_general_list_str' : function(){return 'Identifier^Style_string\n'+
            'Style_string is a string and set to its object.style.XXXX. Therefore you can use all of styles in CSS, which ranges from \'background\' or \'border\' to \'fontSize\', \'width\' or \'height\'\n'+ this.GeneralRules;},
//            'About Identifier, see \'board group\'.',
          'catalog.board.recommendation' : 'Scans \'board announcement\' and gets owner\'s recommendation. This recommendation must be start \'Recommendation: \', and the following part of the line is treated as a line of board groups. The recommendation can be seen in a last line of board groups.',
          'catalog_triage_str' : '// 1st column :\n'+
            '//   KILL : delete forever.\n'+
            '//   TIME : delete until the thread gets new replies.\n'+
            '//   NONE : just change its appearance.\n'+
            '//   UNDO : undo the last modification.\n'+
            '//   WATCH : watch this thread, or I\'ve read all replies in this thread.\n'+
            '//   UNWATCH : unwatch this thread.\n'+
            '// 2nd column : strings in the button.\n'+
            '// 3rd column : style in HTML.\n'+
            '// Repeat these as you wish.',
          'overwrite_site2_eval_str' : 'For developers. This function is killed by security reason. If you want to use, you must uncomment the function \'pref_func.site2_eval\' by yourself.',
          'thread_reader.buttons.B' : 'Bookmark this thread to current catalog.',
          'thread_reader.buttons.UB': 'Unbookmark this thread from current catalog.',
          'thread_reader.buttons.X' : function(){return 'Kill this thread from parent catalog' + ((pref.thread_reader.triage_close)? ', and close.' : '.');},
          'thread_reader.buttons.v' : function(){return 'Hide this thread from parent catalog untill it gets new posts' + ((pref.thread_reader.triage_close)? ', and close.' : '.');},
          'catalog_open_where' : 'this tab: open the thread in this tab, and catalog will be closed.\nnew tab always: this enables you to open a thread in multiple tabs.\nnamed tab: this prevents you from opening a thread in multiple tabs.\na fixed tab: this enables you to use a catalog window as a dashboard.',
          dummy: ''
        };
        return {
          add_hier: add_hier,
          remove_hier: remove_hier,
          add: add,
          remove: remove,
          show: show,
          show_1: show_1,
          hide: hide,
          str: str
        }
      })(),
      pref_samples : {
        simple: {
          catalog_popup : false,
          catalog_format : {show:{posts:true}},
          catalog_triage_str: 'KILL,X,',
          catalog : {style_general_list_str:'%border:4px solid #d6daf0\n%margin:4px'}
        },
        backwash: {
          catalog_triage_str :
            'NONE,O,width:;height:,NONE,O,border:4px solid #ff0000;width:100px;height:100px,NONE,O,border:4px solid #00ff00;width:100px;height:100px,'+
            'NONE,O,border:4px solid #0000ff;width:100px;height:100px,NONE,O,border:4px solid #ffff00;width:100px;height:100px,'+
            'NONE,O,border:4px solid #ff00ff;width:100px;height:100px,NONE,O,border:4px solid #00ffff;width:100px;height:100px',
          catalog_expand_at_initial : true,
          catalog_click: 'expand',
          catalog_format: {show:  {style:  true, contents:  true, layout:  true, posts: true, fileinfo: true, images_2nd: true}},
          catalog_popup: false,
        },
        recommend: {
          catalog_auto_update : true,
          catalog_auto_update_period : 1,
          max_threads_at_refresh : 500,
          catalog: {
            auto_load_filter : true,
            auto_save_filter : true,
            order: {
              sticky:'first',
//              find_sage_in_8chan: true
            },
            board: {board_tags_same: true},
          },
        },
        'easy.virtualBoard_10': {
          catalog_auto_update : true,
          catalog_auto_update_period : 10,
          virtualBoard: {show: true, scan: true, max:20},
          catalog: {auto_load_filter:true, auto_save_filter:true},
        },
        'easy.virtualBoard_1': {
          catalog_auto_update : true,
          catalog_auto_update_period : 1,
          virtualBoard: {show: true, scan: true, max:100, scanDelay: 20},
          catalog: {auto_load_filter:true, auto_save_filter:true},
        },
        'easy.virtualBoard_8_50': {
          catalog_auto_update : true,
          catalog_auto_update_period : 5,
          virtualBoard: {show: true, scan: true, max:100, scanDelay: 20},
          scan:{max:50},
          catalog: {auto_load_filter:true, auto_save_filter:true},
        },
        'easy.virtualBoard_8_100': {
          catalog_auto_update : true,
          catalog_auto_update_period : 5,
          virtualBoard: {show: true, scan: true, max:100, scanDelay: 20},
          scan:{max:100},
          catalog: {auto_load_filter:true, auto_save_filter:true},
        },
        'easy.virtualBoard_8_500': {
          catalog_auto_update : true,
          catalog_auto_update_period : 5,
          virtualBoard: {show: true, scan: true, max:100, scanDelay: 20},
          scan:{max:500},
          catalog: {auto_load_filter:true, auto_save_filter:true},
        },
        'easy.virtualBoard_8_all': {
          catalog_auto_update : true,
          catalog_auto_update_period : 5,
          virtualBoard: {show: true, scan: true, max:100, scanDelay: 20},
          scan:{max:10000},
          catalog: {auto_load_filter:true, auto_save_filter:true},
        },
        'easy.posts_0h': {
          catalog:{filter:{time_str:null, time_watch:true}},
          func: function(){pref_func.pref_samples['easy.posts_0h'].catalog.filter.time_str = new Date().toLocaleString();}
        },
        'easy.posts_24h': {
          catalog:{filter:{time_str:null, time_watch:true}},
          func: function(){pref_func.pref_samples['easy.posts_24h'].catalog.filter.time_str = new Date(Date.now()-24*3600000).toLocaleString();}
        },
        'easy.posts_48h': {
          catalog:{filter:{time_str:null, time_watch:true}},
          func: function(){pref_func.pref_samples['easy.posts_48h'].catalog.filter.time_str = new Date(Date.now()-48*3600000).toLocaleString();}
        },
        'easy.embed_index': {
          catalog_format:{show:{style:false, contents:false, layout:false, posts:true, fileinfo:true}},
          catalog_footer_br:false,
          catalog_size_tn_resize:false,
          catalog:{embed_page:true, auto_load_filter:true, auto_save_filter:true},
        },
        'easy.embed_index_lazy': {
          catalog_format:{show:{style:false, contents:false, layout:false, posts:true, fileinfo:true}},
          catalog_footer_br:false,
          catalog_size_tn_resize:false,
          catalog:{embed_page:true, auto_load_filter:true, auto_save_filter:true, auto_watch:false},
          catalog_footer_show_nof_rep_to_me:false,
          catalog_footer_show_nof_rep:false,
          liveTag:{use:false},
          catalog_draw_on_demand:true,
          catalog_load_on_demand:true,
          notify:{desktop:{notify:false}},
          page:{scan_tag:false},
        },
        'easy.embed_index_infinite': {
          catalog_format:{show:{style:false, contents:false, layout:false, posts:true, fileinfo:true}},
          catalog_footer_br:false,
          catalog_size_tn_resize:false,
          catalog_max_page_auto:true,
          catalog:{embed_page:true, auto_load_filter:true, auto_save_filter:true},
          catalog_draw_on_demand:true,
          catalog_load_on_demand:true,
        },
        'easy.embed_index_backwash': {
          catalog_format:{show:{style:false, contents:false, layout:false, posts:true, fileinfo:true}},
          catalog_footer_br:false,
          catalog_size_tn_resize:false,
          catalog_max_page_auto:true,
          catalog:{embed_page:true, auto_load_filter:true, auto_save_filter:true},
          catalog_draw_on_demand:true,
          catalog_load_on_demand:true,
          catalog_auto_update : true,
          catalog_auto_update_period : 0,
        },
        triage_simple_kill: {
          catalog_triage_str: 'KILL,X,',
//          'pn_catalog_triage': 'hide forever.'
        },
        triage_simple: {
          catalog_triage_str: 'KILL,X,,TIME,v,,WATCH,W,,UNWATCH,UW,,UNDO,U,',
//          'pn_catalog_triage': 'hide forever, hide until new replies, watch, unwatch, undo.'
        },
        triage_colorful: {
          catalog_triage_str:
            'KILL,X,,KILL,X,background:#c3dcf9,KILL,X,background:#b8efc2,'+
            'KILL,X,background:#efedbe,KILL,X,background:#fbd5fb,KILL,X,background:#fac2c5\n'+
            'TIME,v,,TIME,v,background:#c3dcf9,TIME,v,background:#b8efc2,'+
            'TIME,v,background:#efedbe,TIME,v,background:#fbd5fb,TIME,v,background:#fac2c5\n'+
            'NONE,O,,NONE,O,background:#c3dcf9,NONE,O,background:#b8efc2,'+
            'NONE,O,background:#efedbe,NONE,O,background:#fbd5fb,NONE,O,background:#fac2c5\n'+
            'UNDO,U,,WATCH,W,,UNWATCH,UW,,GO,G,\n',
//          'pn_catalog_triage': '1st row: Hide it forever.\n'+
//            '2nd row: Hide until new replies\n' +
//            '3rd row: Change its appearance.\n' +
//            'Undo, Watch, UnWatch.\n'
        },
        triage_borders: {
          catalog_triage_str:
            'KILL,X,,KILL,X,border:3px solid blue,KILL,X,border:3px solid lime,'+
            'KILL,X,border:3px solid yellow,KILL,X,border:3px solid orange,KILL,X,border:3px solid red\n'+
            'TIME,v,,TIME,v,border:3px solid blue,TIME,v,border:3px solid lime,'+
            'TIME,v,border:3px solid yellow,TIME,v,border:3px solid orange,TIME,v,border:3px solid red\n'+
            'NONE,O,,NONE,O,border:3px solid blue,NONE,O,border:3px solid lime,'+
            'NONE,O,border:3px solid yellow,NONE,O,border:3px solid orange,NONE,O,border:3px solid red\n'+
            'UNDO,U,,WATCH,W,,UNWATCH,UW,,GO,G,\n',
//          'pn_catalog_triage': '1st row: Hide it forever.\n'+
//            '2nd row: Hide until new replies\n' +
//            '3rd row: Change its appearance.\n' +
//            'Undo, Watch, UnWatch.\n'
        },
        triage_samples: {
          catalog_triage_str: 
            'KILL,delete forever,\n'+
            'TIME,hide until new replies,\n'+
            'NONE,back to default design,background:;border:;\n'+
            'NONE,border and background,background:#c3dcf9;border:3px solid blue\n'+
            'NONE,border 3px,border:3px solid blue\n'+
            'NONE,background,background:#c3dcf9\n'+
            'NONE,border 5px,border:5px solid blue\n'+
            'NONE,border 1px,border:1px solid blue\n'+
            'NONE,transparent,background:\n'+
            'NONE,shrink,width:100px;height:100px\n'+
            'GO,open this thread,\n',
//          'pn_catalog_triage': 'samples\n'
        },
        pn_samples : null,
        init : function(){
          if (pref_func.pref_samples.pn_samples) return;
          var html = 'General samples:<br>'+
                     '<button name="simple">simple</button><br>'+
                     '<button name="backwash">backwash</button><br>'+
                     '<button name="recommend">recommend for desktop/note</button><br>'+
                     'Triages:<br>'+
                     '<button name="triage_simple_kill">simple_kill</button><br>'+
                     '<button name="triage_simple">simple</button><br>'+
                     '<button name="triage_colorful">colorful</button><br>'+
                     '<button name="triage_borders">borders</button><br>'+
                     '<button name="triage_samples">samples</button><br>';
          cnst.make_popup(pref_func.pref_samples,'pn_samples',html,pref_func.pref_samples.onclick_event);
//          pref_func.pref_samples.pn_samples = cnst.init('left:0px:tile:get:bottom:Show:tb',cnst.void_func,cnst.void_func,pref_func.pref_samples.destroy,cnst.void_func)[0];
//          var pn_smpl = pref_func.pref_samples.pn_samples;
//          pn_smpl.childNodes[1].innerHTML = '<button name="backwash">backwash</button>';
//          var buttons = pn_smpl.childNodes[1].getElementsByTagName('BUTTON');
//          for (var i=0;i<buttons.length;i++) buttons[i].onclick = pref_func.pref_samples.onclick_event;
        },
//        destroy : function() {
//          pref_func.pref_samples.pn_samples = cnst.div_destroy(pref_func.pref_samples.pn_samples, true);
//        },
        get_name: function(src,names,str){
          for (var i in src) {
            if (typeof(src[i])!=='object') names.push(str+i);
            else pref_func.pref_samples.get_name(src[i],names,str+i+'.');
          }
        },
        onclick_event : function() {
          var src = pref_func.pref_samples[this.name];
          if (typeof(src.func)==='function') src.func();
          pref_func.pref_overwrite(pref,src);
          pref_func.pref_overwrite(pref_func.tooltips.str,src);
          var names = [];
          pref_func.pref_samples.get_name(src,names,'');
          for (var i=0;i<names.length;i++) {
            var pn = document.getElementsByName(names[i])[0];
            if (pn) {
              pref_func.apply_prep(pn,false);  // refresh appearance.
//            pref_func.apply_prep(pn,true);   // make obj.
//              pref_func.invoke_onchange(pn,true);   // make obj.
            }
            pref_func.make_pref_obj(names[i]); // make obj.
            if (pref_func.settings.onchange_funcs[names[i]]) pref_func.settings.onchange_funcs[names[i]]();
          }
          if (sessionStorage) sessionStorage.pref = JSON.stringify(pref);
        } 
      },
      settings: {
        pn13 : null,
        show_hide : function(e){
          if (pref_func.settings.pn13===null) {
            var pos = ((e.clientX*2>window.innerWidth)? 'right':'left') + ':0px:' + ((e.clientY*2>window.innerHeight)? 'bottom:0':'top:'+site.header_height())+'px';
            var pn13 = cnst.init(pos+':Show:tb',cnst.void_func,cnst.void_func,pref_func.settings.show_hide,cnst.void_func)[0];
            var pn13_0_2 = cnst.add_to_tb(pn13,
              '<select name="settings.indexing">'+
                '<option>' + pref_func.settings.options.join('</option><option>') + '</option>'+
              '</select>');
            pn13_0_2.getElementsByTagName('select')['settings.indexing'].selectedIndex = pref.settings.indexing;
            pref_func.settings.pn13 = pn13; // for onchange func.
            pref_func.mirror_targets.pn13_1 = pn13.childNodes[1]; // for mirror.
            pref_func.settings.onchange_funcs['settings.indexing'](); // leaks 1 EventLister, but call add_onchange in this.
            pref_func.add_onchange(pn13_0_2,pref_func.settings.onchange_funcs); // leaks 1.
            cnst.bottom_top(pn13);
          } else {
            pref_func.mirror_targets.pn13_1 = null;
            pref_func.settings.files_store();
            pref_func.settings.pn13 = cnst.div_destroy(pref_func.settings.pn13, true); // returns null
          }
        },
////        show_hide : function(){cnst.make_destroy(pref_func.settings,'pn13',pref_func.settings.prep_pn13,pref_func.settings.destroy_pn13);}, // working code.
////        prep_pn13 : function(){
////          var pn13 = cnst.init('left:0px:tile:get:bottom:Show:tb',cnst.void_func,cnst.void_func,pref_func.settings.show_hide,cnst.void_func)[0];
////          var pn13_0_2 = cnst.add_to_tb(pn13,
////            '<select name="settings.indexing">'+
////              pref_func.settings.options.join('') + 
////////              '<option>Catalog: General 0</option>'+
////////              '<option>Catalog: General 1</option>'+
////////              '<option>Catalog: Board Group</option>'+
////////              '<option>Catalog: Appearance</option>'+
////////              '<option>Catalog: Design</option>'+
////////              '<option>Catalog: Footer/PopUp</option>'+
////////              '<option>Watcher / Notifiers</option>'+
//////////              '<option>Statistics:</option>'+
////////              '<option>UIP tracker for 4chan</option>'+
////////              '<option>Command Line Interface</option>'+
//////////              '<option>Workaround for dollchan</option>'+
////////              '<option>General</option>'+
////////              '<option>About</option>'+
////            '</select>');
////          pn13_0_2.getElementsByTagName('*')['settings.indexing'].selectedIndex = pref.settings.indexing;
////          pref_func.settings.pn13 = pn13; // for onchange func.
////          pref_func.mirror_targets.pn13_1 = pn13.childNodes[1]; // for mirror.
////          pref_func.settings.onchange_funcs['settings.indexing'](); // leaks 1 EventLister, but call add_onchange in this.
////          pref_func.add_onchange(pn13_0_2,pref_func.settings.onchange_funcs); // leaks 1.
////          cnst.bottom_top(pn13);
////          return pn13;
////        },
////        destroy_pn13 : function(){
////          pref_func.mirror_targets.pn13_1 = null;
////          pref_func.settings.files_store();
////          pref_func.settings.pn13 = cnst.div_destroy(pref_func.settings.pn13, true); // returns null
////        },
        apply_pn13_1: function(set){pref_func.apply_prep(pref_func.settings.pn13.childNodes[1],set);},
        files_store: function(){
          var inputs = pref_func.settings.pn13.getElementsByTagName('input');
          for (var i=0;i<inputs.length;i++) if (inputs[i].type==='file') pref_func.settings.files_pool[inputs[i].name] = inputs[i].parentNode.removeChild(inputs[i]);
        },
        files_pool: {},
        insert_menu: function(menu,html){
          var idx = pref_func.settings.options.length-1;
          pref_func.settings.options.splice(idx,0,menu);
          pref_func.settings.htmls.splice(idx,0,html);
        },
////        options: [
////          '<option>Easy Setting:</option>',
////          '<option>Virtual board:</option>',
////          '<option>Initialization:</option>',
////          '<option>Catalog: General 1</option>',
////          '<option>Catalog: Board Group</option>',
////          '<option>Catalog: Live Tag</option>',
////          '<option>Catalog: Appearance</option>',
////          '<option>Catalog: Design</option>',
////          '<option>Catalog: Footer/PopUp</option>',
////          '<option>Watcher</option>',
////          '<option>Notifiers</option>',
//////          '<option>Statistics:</option>',
////          '<option>UIP tracker for 4chan</option>',
////          '<option>Command Line Interface</option>',
//////          '<option>Workaround for dollchan</option>',
////          '<option>Networking</option>',
////          '<option>General</option>',
////          '<option>About</option>'
////        ],
        options: [
          'Easy Setting:',
          'Virtual board:',
          'Initialization:',
          'Catalog: General 1',
          'Catalog: Board Group',
          'Catalog: Live Tag',
          'Catalog: Appearance',
          'Catalog: Design',
          'Catalog: Footer/PopUp',
          'Watcher',
          'Notifiers',
//          'Statistics:',
          'UIP tracker for 4chan',
          'Command Line Interface',
//          'Workaround for dollchan',
          'Networking',
          'General',
          'Features',
          'About'
        ],
        htmls: [
          'Easy Setting:<br>'+
          '&emsp;VBs: virtual boards<br>'+
          '&emsp;AU: auto update every X min<br>'+
          '&emsp;<button name="easy.virtualBoard_10">Click</button> 20 VBs / AU 10 min. (for lainchan)<br>'+
          '&emsp;<button name="easy.virtualBoard_1">Click</button> 100 VBs / AU 1 min. (for 4chan)<br>'+
          '&emsp;<button name="easy.virtualBoard_8_50">Click</button> 100 VBs / AU 5 min from top 50 boards. (for 8chan)<br>'+
          '&emsp;<button name="easy.virtualBoard_8_100">Click</button> 100 VBs / AU 5 min from top 100 boards. (for 8chan)<br>'+
          '&emsp;<button name="easy.virtualBoard_8_500">Click</button> 100 VBs / AU 5 min from top 500 boards. (for 8chan)<br>'+
          '&emsp;<button name="easy.virtualBoard_8_all">Click</button> 100 VBs / AU 5 min from all boards. (for 8chan)<br>'+
          '<br>'+
          '&emsp;<button name="easy.posts_0h">Click</button> I want to check all new posts from now.<br>'+
          '&emsp;<button name="easy.posts_24h">Click</button> I want to check all posts in recent 24 hours.<br>'+
          '&emsp;<button name="easy.posts_48h">Click</button> I want to check all posts in recent 48 hours.<br>'+
          '<br>'+
          '&emsp;<button name="easy.embed_index">Click</button> hide stub in index pages.<br>'+
          '&emsp;<button name="easy.embed_index_lazy">Click</button> hide stub in index pages for narrow band.<br>'+
          '&emsp;<button name="easy.embed_index_infinite">Click</button> hide stub in index pages with infinite scroll.<br>'+
          '&emsp;<button name="easy.embed_index_backwash">Click</button> Backwash style. (hide stub/infinite scroll/quick auto update)<br>'+
          '',
          'Virtual board:<br>'+
          '&emsp;<input type="checkbox" name="virtualBoard.show"> Show virtual boards'+
          ', up to: <input type="text" name="virtualBoard.max" size="3" style="text-align: right;"><br>'+
          '&emsp;<input type="checkbox" name="virtualBoard.scan"> Scan at start up'+
          ', delay: <input type="text" name="virtualBoard.scanDelay" size="2" style="text-align: right;">s<br>'+
          '&emsp;&emsp;&emsp;Scan: <button name="virtualBoard.scanStart">Start</button>'+
          '&emsp;<button name="virtualBoard.scanStop">Stop</button><br>'+
          '&emsp;Handling of physical boards:<br>'+
          '&emsp;&emsp;<input type="radio" name="virtualBoard.p_board" value="both"> Show as they are<br>'+
          '&emsp;&emsp;&emsp;<input type="checkbox" name="virtualBoard.p_remove"> Remove virtual boards of the same name<br>'+
          '&emsp;&emsp;<input type="radio" name="virtualBoard.p_board" value="replace"> Replace with virtual boards<br>'+
          '&emsp;<input type="checkbox" name="liveTag.show_info_onmouseover"> Show infomation on hover<br>'+
//          '&emsp;Style of selected board:<textarea rows="1" cols="20" name="liveTag.style_in_str"></textarea><br>'+
          '&emsp;Style of selected board:<input type="text" name="liveTag.style_in_str" size="30"><br>'+
          '&emsp;<input type="checkbox" name="liveTag.style"> Add style:<br>'+
//          '&emsp;&emsp;Unread replies to me:<textarea rows="1" cols="20" name="liveTag.style_urtm_str"></textarea><br>'+
//          '&emsp;&emsp;Unread replies:<textarea rows="1" cols="20" name="liveTag.style_ur_str"></textarea><br>'+
          '&emsp;&emsp;Unread replies to me:<input type="text" name="liveTag.style_urtm_str" size="30"><br>'+
          '&emsp;&emsp;Unread replies:<input type="text" name="liveTag.style_ur_str" size="30"><br>'+
          '',
          'Initialization:<br>'+
          '&emsp;<input type="checkbox" name="catalog.embed"> Embed to native catalog<br>'+
          '&emsp;<input type="checkbox" name="catalog.embed_page"> Embed to native index page<br>'+
          '&emsp;&emsp;&emsp;<input type="checkbox" name="catalog_max_page_auto"> Set max page automatically<br>'+
//          '&emsp;&emsp;<input type="checkbox" name="page.infinite"> Infinite scroll<br>'+
          '&emsp;&emsp;<input type="checkbox" name="page.popup"> Pop up<br>'+
          '&emsp;&emsp;&emsp;<input type="checkbox" name="page.popup_native"> Native has pop up function<br>'+
          '&emsp;&emsp;<input type="checkbox" name="page.colorID"> Color ID<br>'+
          '&emsp;&emsp;&emsp;<input type="checkbox" name="page.colorID_native"> Native has color ID function<br>'+
          '&emsp;&emsp;<input type="checkbox" name="page.scan_tag"> Scan tags at initial<br>'+
          '&emsp;<input type="checkbox" name="catalog.embed_frame"> Embed to frame<br>'+
          '<br>'+
//          '&emsp;Max threads in catalog: <input type="text" name="catalog.max_threads" size="4" style="text-align: right;"><br>'+
          '&emsp;<input type="checkbox" name="catalog.refresh.initial"> Refresh at initial<br>'+
          '&emsp;&emsp;<input type="checkbox" name="catalog.refresh.except_bt"> Except the page of selecting boards\' tag.<br>'+
          '&emsp;<input type="checkbox" name="catalog.refresh.at_switch"> Clear and refresh when boards are switched<br>'+
          '',
          'Catalog:<br>'+
          '&emsp;Design from:<br>'+
          '&emsp;&emsp;<input type="radio" name="catalog.design" value="page">Page<br>'+
          '&emsp;&emsp;<input type="radio" name="catalog.design" value="auto">Auto<br>'+
          '&emsp;&emsp;<input type="radio" name="catalog.design" value="catalog">Catalog<br>'+
          '&emsp;&emsp;&emsp;<input type="checkbox" name="catalog.catalog_json"> From json file<br>'+
          '&emsp;Click area:<br>'+
          '&emsp;&emsp;<input type="radio" name="catalog_click_area" value="thumbnail">Thumbnail<br>'+
          '&emsp;&emsp;<input type="radio" name="catalog_click_area" value="entire">Entire thread card<br>'+
          '&emsp;Click to:<br>'+
          '&emsp;&emsp;<input type="radio" name="catalog_click" value="open">Go to/open the thread<br>'+
          '&emsp;&emsp;&emsp; Open the link of \'Last 50 Posts\'<br>'+
          '&emsp;&emsp;&emsp;&emsp;<input type="radio" name="catalog_open_last50" value="no">No. Open the link of entire thread<br>'+
          '&emsp;&emsp;&emsp;&emsp;<input type="radio" name="catalog_open_last50" value="exist">If it exists<br>'+
          '&emsp;&emsp;&emsp;&emsp;<input type="radio" name="catalog_open_last50" value="exist_watch">If it exists and unread posts are less than 50<br>'+
          '&emsp;&emsp;&emsp;&emsp;<input type="radio" name="catalog_open_last50" value="speculative">If it is estimated to exist<br>'+
          '&emsp;&emsp;&emsp;&emsp;<input type="radio" name="catalog_open_last50" value="spec_watch">If it is estimated to exist and unread posts are less than 50<br>'+
          '&emsp;&emsp;&emsp; Open the thread in<br>'+
//          '&emsp;&emsp;&emsp;&emsp;&emsp;<input type="checkbox" name="catalog_open_where_click"> Apply to reply links in index page<br>'+
          '&emsp;&emsp;&emsp;&emsp;<input type="radio" name="catalog_open_where" value="_self">this tab<br>'+
          '&emsp;&emsp;&emsp;&emsp;<input type="radio" name="catalog_open_where" value="_blank">new tab always<br>'+
          '&emsp;&emsp;&emsp;&emsp;<input type="radio" name="catalog_open_where" value="named">named tab<br>'+
          '&emsp;&emsp;&emsp;&emsp;<input type="radio" name="catalog_open_where" value="CatChan_tgt">a fixed tab<br>'+
//          '&emsp;&emsp;&emsp;&emsp;<input type="checkbox" name="catalog_use_named_window"> Prevent opening a thread in multiple tabs<br>'+
          '&emsp;&emsp;<input type="radio" name="catalog_click" value="expand">Expand/shrink the OP in catalog<br>'+
          '&emsp;&emsp;&emsp;&emsp;<input type="checkbox" name="catalog_expand_at_initial"> Expand at initial<br>'+
          '&emsp;&emsp;&emsp;&emsp;<input type="checkbox" name="catalog_expand_at_initial_embed"> Expand at initial in index.<br>'+
          '&emsp;&emsp;&emsp;&emsp;<input type="checkbox" name="catalog_expand_with_hr"> Insert horizontal splitter when it is expanded<br>'+
          '&emsp;&emsp;&emsp;<input type="checkbox" name="catalog_no_popup_at_expanded"> Don\'t popup when the catalog is expanded<br>'+
          '&emsp;&emsp;<input type="radio" name="catalog_click" value="none">None<br>'+
          '',
          'Catalog:<br>'+
          '&emsp;Board group configuration:<br>'+
          '&emsp;&emsp;<textarea rows="1" cols="60" name="catalog_board_list_str"></textarea><br>'+
          '&emsp;&emsp;<input type="checkbox" name="catalog.board.recommendation"> Read owner\'s recommendation '+
          '&emsp;&emsp;<button name="tag.recommendation_add">Add to list</button><br>'+
//          '&emsp;&emsp;<input type="button" value="Scan"> Scan board tags<br>'+
//          '&emsp;&emsp;<input type="button" value="Generate" name="tag.generate"> Generate board groups from tags <br>'+
          '&emsp;&emsp;<input type="checkbox" name="catalog.board.board_tags"> Generate board groups from tags '+
          '&emsp;&emsp;<button name="tag.scan">Scan</button><br>'+
          '&emsp;&emsp;<input type="checkbox" name="catalog.board.board_tags_same"> Pick up boards which have the same tag'+
          '&emsp;&emsp;<button name="tag.same_tag_refresh">Refresh</button><br>'+
          '&emsp;<input type="checkbox" name="catalog.board.ex_list"> Use exclusive list<br>'+
          '&emsp;&emsp;<textarea rows="1" cols="40" name="catalog.board.ex_list_str"></textarea><br>'+
          '&emsp;<input type="checkbox" name="catalog.style_general_list"> Use general style<br>'+
          '&emsp;&emsp;<textarea rows="1" cols="40" name="catalog.style_general_list_str"></textarea><br>'+
          '&emsp;<input type="checkbox" name="catalog.mimic_base_site"> Mimic base site<br>'+
          '&emsp;Tagging:<br>'+
          '&emsp;&emsp;Ignore tags latter than <input type="text" name="catalog.tag.ignore" size="2" style="text-align: right;">th in a board/thread<br>'+
          '&emsp;&emsp;Ignore boards/threads which have more than <input type="text" name="catalog.tag.max" size="2" style="text-align: right;"> tags<br>'+
          '&emsp;Scan:<br>'+
          '&emsp;&emsp;Max scan boards <input type="text" name="scan.max" size="6" style="text-align: right;"><br>'+
          '&emsp;&emsp;Max found threads <input type="text" name="scan.max_threads" size="6" style="text-align: right;"><br>'+
          '&emsp;&emsp;Reload older than <input type="text" name="scan.lifetime" size="6" style="text-align: right;"> minutes old<br>'+
          '&emsp;&emsp;&emsp;Num of crawler: <input type="text" name="scan.crawler" size="2" style="text-align: right;"><br>'+
          '&emsp;&emsp;&emsp;&emsp;<input type="checkbox" name="scan.crawler_adaptive"> Spawn adaptively at idle' + 
          '<input type="text" name="scan.crawler_idle_time_to_spawn" size="2" style="text-align: right;">ms<br>',
          'Catalog:<br>'+
          '&emsp;<input type="checkbox" name="liveTag.use"> Live Tagging from:<br>'+
          '&emsp;&emsp;&emsp;<input type="radio" name="liveTag.from" value="op">OP<br>'+
          '&emsp;&emsp;&emsp;<input type="radio" name="liveTag.from" value="post">All posts<br>'+
          '&emsp;&emsp;&emsp;max: <input type="text" name="liveTag.max" size="2" style="text-align: right;">'+
          ', max string length: <input type="text" name="liveTag.maxstr" size="2" style="text-align: right;"><br>'+
          '&emsp;&emsp;&emsp;<input type="checkbox" name="liveTag.ci"> Case insensitive<br>'+
          '&emsp;&emsp;<input type="checkbox" name="liveTag.inherit_board_name"> Inherits board\'s name<br>'+
          '&emsp;&emsp;&emsp;<input type="checkbox" name="liveTag.lock_board_name"> Lock & sticky<br>'+
          '&emsp;&emsp;<input type="checkbox" name="liveTag.inherit_board_tags"> Inherits board\'s tags<br>'+
          '&emsp;&emsp;&emsp;<input type="checkbox" name="liveTag.lock_board_tags"> Lock & sticky<br>'+
          '&emsp;&emsp;<input type="checkbox" name="liveTag.lock_tags_in_op"> Lock & sticky tags in OP<br>'+
          '&emsp;&emsp;<input type="checkbox" name="liveTag.ex_list"> Use exclusive list<br>'+
          '&emsp;&emsp;&emsp;String list to remove before extracting tags<br>'+
          '&emsp;&emsp;&emsp;&emsp;<textarea rows="1" cols="40" name="liveTag.rm_list_str"></textarea><br>'+
          '&emsp;&emsp;&emsp;Tag list to remove after extracting tags<br>'+
          '&emsp;&emsp;&emsp;&emsp;<textarea rows="1" cols="40" name="liveTag.ex_list_str"></textarea><br>'+
          '&emsp;&emsp;<input type="checkbox" name="liveTag.rm_404_immediately"> Remove 404 threads immediately<br>'+
          '&emsp;&emsp;<input type="checkbox" name="liveTag.utilize_boards_json"> Utilize boards.json in 8chan<br>'+
          '&emsp;&emsp;Delay to display:<br>'+
          '&emsp;&emsp;&emsp;Foreground: <input type="text" name="liveTag.disp_delay.fg" size="4" style="text-align: right;">ms<br>'+
          '&emsp;&emsp;&emsp;Gackground: <input type="text" name="liveTag.disp_delay.bg" size="4" style="text-align: right;">ms<br>'+
          '&emsp;&emsp;Click function:<br>'+
          '&emsp;&emsp;<input type="radio" name="liveTag.click_func" value="in">None -> Include -> None<br>'+
          '&emsp;&emsp;<input type="radio" name="liveTag.click_func" value="inex">None -> Include -> Exclude -> None<br>'+
          '&emsp;&emsp;<input type="radio" name="liveTag.click_func" value="ex">None -> Exclude -> None<br>',
          'Catalog:<br>'+
          '&emsp;Shows in title bar:<br>'+
          '&emsp;&emsp;<input type="checkbox" name="catalog.appearance.titleBar.filter">Checkbox to show filter<br>'+
          '&emsp;&emsp;<input type="checkbox" name="catalog.appearance.titleBar.settings">Checkbox to show settings<br>'+
          '&emsp;&emsp;<input type="checkbox" name="catalog.appearance.titleBar.refresh">Refresh button<br>'+
          '&emsp;&emsp;<input type="checkbox" name="catalog.appearance.titleBar.num_of_pages">Num of pages to refresh<br>'+
          '&emsp;&emsp;<input type="checkbox" name="catalog.appearance.titleBar.boards_selector">Boards selector<br>'+
          '&emsp;At initial:<br>'+
          '&emsp;&emsp;<input type="radio" name="catalog.appearance.initial.state" value="maximized">Maximized<br>'+
          '&emsp;&emsp;<input type="radio" name="catalog.appearance.initial.state" value="floating">Floating '+
          '<input type="text" name="catalog.appearance.initial.width" size="4" style="text-align: right;"> x '+
          '<input type="text" name="catalog.appearance.initial.height" size="4" style="text-align: right;"><br>'+
          '&emsp;&emsp;<input type="radio" name="catalog.appearance.initial.state" value="top">Embed to top<br>'+
          '&emsp;&emsp;<input type="radio" name="catalog.appearance.initial.state" value="bottom">Embed to bottom<br>',
          '<input type="radio" name="catalog.text_mode.mode" value="graphic"> Graphical mode: '+
          '<input type="text" name="catalog_size_width" size="4" style="text-align: right;"> x '+
          '<input type="text" name="catalog_size_height" size="4" style="text-align: right;"><br>'+
          '&emsp;&emsp;<input type="checkbox" name="catalog_size_tn_resize">Resize thumbnails<br>'+
          '&emsp;&emsp;&emsp;1st thumbnail: '+
          '<input type="text" name="catalog_size_tn1_width" size="4" style="text-align: right;"> x '+
          '<input type="text" name="catalog_size_tn1_height" size="4" style="text-align: right;"><br>'+
          '&emsp;&emsp;&emsp;2nd and later: '+
          '<input type="text" name="catalog_size_tn2_width" size="4" style="text-align: right;"> x '+
          '<input type="text" name="catalog_size_tn2_height" size="4" style="text-align: right;"><br>'+
          '&emsp;Catalog/Pop-up/Search<br>'+
          '<!-- &emsp;&emsp;<input type="checkbox" name="catalog_format.show.images_2nd">'+
          '<input type="checkbox" name="catalog_format.hover.images_2nd">'+
          '<input type="checkbox" name="catalog_format.search.images_2nd"> 2nd or more images in OP<br> -->'+
          '&emsp;&emsp;<input type="checkbox" name="catalog_format.show.posts">'+
          '<input type="checkbox" name="catalog_format.hover.posts">'+
          '<input type="checkbox" name="catalog_format.search.posts"> Posts<br>'+
          '&emsp;&emsp;<input type="checkbox" name="catalog_format.show.fileinfo">'+
          '<input type="checkbox" name="catalog_format.hover.fileinfo">'+
          '<input type="checkbox" name="catalog_format.search.fileinfo"> File information<br>'+
          '<!--&emsp;&emsp;<input type="checkbox" name="catalog_checkbox_deletion_show">'+
          '<input type="checkbox" name="catalog_checkbox_deletion_hover">'+
          '<input type="checkbox" name="catalog_checkbox_deletion_search"> Checkbox for deletion<br> -->'+
          '&emsp;&emsp;<input type="checkbox" name="catalog_format.show.contents">'+
          '<input type="checkbox" name="catalog_format.hover.contents">'+
          '<input type="checkbox" name="catalog_format.search.contents"> Format contents<br>'+
          '&emsp;&emsp;<input type="checkbox" name="catalog_format.show.layout">'+
          '<input type="checkbox" name="catalog_format.hover.layout">'+
          '<input type="checkbox" name="catalog_format.search.layout"> Format layout<br>'+
          '&emsp;&emsp;<input type="checkbox" name="catalog_format.show.style">'+
          '<input type="checkbox" name="catalog_format.hover.style">'+
          '<input type="checkbox" name="catalog_format.search.style"> Format style<br>'+
          '<!-- &emsp;&emsp;<input type="checkbox" name="catalog_border_show">&emsp;&emsp;&emsp; Show border<br> -->'+
          '<!-- &emsp;&emsp;<input type="checkbox" name="catalog_enable_background">&emsp;&emsp;&emsp; Use backgfound color<br> -->'+
          '&emsp;Num of posts in thread headline: <input type="text" name="catalog_t2h_num_of_posts" size="3" style="text-align: right;"><br>'+
          '<input type="radio" name="catalog.text_mode.mode" value="text"> Text mode: '+
          '<input type="text" name="catalog_size_text_width" size="4" style="text-align: right;"> x '+
          '<input type="text" name="catalog_size_text_height" size="4" style="text-align: right;"><br>'+
          '&emsp;<input type="checkbox" name="catalog.text_mode.sub"> Show title<br>'+
          '&emsp;<input type="checkbox" name="catalog.text_mode.name"> Show op\'s name<br>'+
          '&emsp;<input type="checkbox" name="catalog.text_mode.com"> Show op\'s comment<br>'+
          'Frame size : '+
          '<input type="text" name="catalog_size_frame0_width" size="4" style="text-align: right;">%, '+
          '<input type="text" name="catalog_size_frame1_width" size="4" style="text-align: right;">%<br>'+
          '<input type="checkbox" name="catalog_triage"> Enable triage pop-up<br>'+
          '&emsp;Where to show triage:<br>'+
          '&emsp;&emsp;<input type="radio" name="catalog_triage_place" value="topLeft"> Top left'+
          '&emsp;&emsp;&emsp;<input type="radio" name="catalog_triage_place" value="topRight"> Top right<br>'+
          '&emsp;&emsp;<input type="radio" name="catalog_triage_place" value="bottomLeft"> Bottom left'+
          '&emsp;&emsp;<input type="radio" name="catalog_triage_place" value="bottomRight"> Bottom right<br>'+
          '&emsp; Style:<textarea style="height:1em" cols="40" name="catalog_triage_str"></textarea><br>'+
          '<!-- &emsp;<input type="checkbox" name="catalog_enable_cross_board"> Enable cross-board catalog<br> -->'+
          '<!-- &emsp;<input type="checkbox" name="catalog_enable_cross_domain"> Enable cross-domain catalog<br> -->'+
          '<!-- &emsp;&emsp; Cache working in <textarea style="height:1em" cols="20" name="catalog_sw_domain"></textarea><br> -->',
          'Catalog:<br>'+
          '&emsp;<input type="checkbox" name="catalog_footer"> Show information footer<br>'+
          '&emsp;&emsp;&emsp;<input type="checkbox" name="catalog_footer_br"> Always over/under the image<br>'+
          '&emsp;&emsp;<input type="checkbox" name="catalog_footer_show_site_name"> Show site\'s name(site)<br>'+
          '&emsp;&emsp;<input type="checkbox" name="catalog_footer_show_board_name"> Show board\'s name(board)<br>'+
          '&emsp;&emsp;<input type="checkbox" name="catalog_footer_show_thread_no"> Show thread\'s no(thread)<br>'+
          '&emsp;&emsp;<input type="checkbox" name="catalog_footer_show_nof_rep"> Show num of new replies(nr)<br>'+
          '&emsp;&emsp;&emsp;<input type="checkbox" name="catalog_footer_show_nof_rep_to_me"> Show num of new replies to me(nrtm)<br>'+
          '&emsp;&emsp;<input type="checkbox" name="catalog.footer.ctime"> Show created time(ctime)<br>'+
          '&emsp;&emsp;<input type="checkbox" name="catalog.footer.btime"> Show bumped time(btime)<br>'+
          '&emsp;&emsp;<input type="checkbox" name="catalog.footer.ptime"> Show last posted time(ptime)<br>'+
          '&emsp;&emsp;<input type="checkbox" name="catalog_footer_show_flag"> Show recent flags(flags)<br>'+
          '&emsp;&emsp;<input type="checkbox" name="catalog_footer_show_page"> Show page No.(page)<br>'+
          '&emsp;&emsp;<input type="checkbox" name="catalog_footer_show_tag"> Show tags'+
//          ', in <input type="text" name="catalog_footer_tag_letters" size="2" style="text-align: right;"> letters'+
          '<br>'+
          '&emsp;&emsp;Design:<br>'+
          '&emsp;&emsp;&emsp;<input type="radio" name="catalog_footer_design" value="native"> U: nrtm/nr / R: r / I: i / P: page site/board/ flags<br>'+
          '&emsp;&emsp;&emsp;<input type="radio" name="catalog_footer_design" value="condensed"> nrtm/nr/r/i/page site/board/ flags<br>'+
          '&emsp;<input type="checkbox" name="catalog_popup"> Use pop-up window<br>'+
          '&emsp;&emsp;appear/disappear:<br>'+
          '&emsp;&emsp;&emsp;<input type="radio" name="catalog_popdown" value="imm">immediately<br>'+
          '&emsp;&emsp;&emsp;<input type="radio" name="catalog_popdown" value="delay">delayed '+
          '<input type="text" name="catalog_popup_delay" size="6" style="text-align: right;">'+
          '<input type="text" name="catalog_popdown_delay" size="6" style="text-align: right;"> ms<br>'+
          '&emsp;&emsp;<input type="checkbox" name="catalog_popup_size_fix"> Fix size when you move it<br>'+
          '&emsp;&emsp;<input type="checkbox" name="catalog_localtime"> Localtime<br>',
          'Watcher:<br>'+
          '&emsp;<input type="checkbox" name="liveTag.watch_all"> Watch all boards<br>'+
          '&emsp;<input type="checkbox" name="catalog.auto_watch"> Auto add to watch list<br>'+
//          '&emsp;<input type="checkbox" name="catalog.order.find_sage_in_8chan"> Find sage post in native catalog in 8chan<br>'+
          '&emsp;<input type="checkbox" name="catalog.unmark_on_hover"> Unmark post on hover<br>'+
          '&emsp;<input type="checkbox" name="thread_reader.use"> Thread reader<br>'+
          '&emsp;&emsp;<input type="checkbox" name="thread_reader.own_posts_tracker"> Own posts tracker<br>'+
          '&emsp;&emsp;&emsp;&emsp;>> (You)<br>'+
          '&emsp;&emsp;&emsp;&emsp;<input type="radio" name="thread_reader.show_reply_to_me_by" value="anchor"> anchor text<br>'+
          '&emsp;&emsp;&emsp;&emsp;<input type="radio" name="thread_reader.show_reply_to_me_by" value="plain"> plain text (for dollchan)<br>'+
          '&emsp;&emsp;&emsp;&emsp;(You) in name field<br>'+
          '&emsp;&emsp;&emsp;&emsp;<input type="radio" name="thread_reader.show_own_post_by" value="anchor"> name string<br>'+
          '&emsp;&emsp;&emsp;&emsp;<input type="radio" name="thread_reader.show_own_post_by" value="plain"> plain text<br>'+
          '&emsp;&emsp;&emsp;<input type="checkbox" name="thread_reader.clean_up_own_posts"> Clean up localStorage at loading embed native catalog<br>'+
          '&emsp;&emsp;<input type="checkbox" name="thread_reader.sync"> Sync with parent catalog<br>'+
          '&emsp;&emsp;&emsp;<input type="checkbox" name="thread_reader.triage"> Show triage to parent catalog<br>'+
          '&emsp;&emsp;&emsp;<input type="checkbox" name="thread_reader.triage_close"> Close window when triage is clicked<br>',
          'Notifiers:<br>'+
          '&emsp;<input type="checkbox" name="notify.desktop.notify"> Desktop<br>'+
          '&emsp;&emsp;&emsp;<input type="text" name="notify.desktop.lifetime" size="3" style="text-align: right;"> seconds. (0 means permanent)<br>'+
          '&emsp;&emsp;&emsp;max: <input type="text" name="notify.desktop.limit" size="3" style="text-align: right;"><br>'+
          '&emsp;&emsp;&emsp;<input type="checkbox" name="notify.desktop.show_last"> Show the last post only<br>'+
          '&emsp;&emsp;<input type="checkbox" name="notify.desktop.reply_to_me"> New replies to me<br>'+
          '&emsp;&emsp;<input type="checkbox" name="notify.desktop.reply"> New replies<br>'+
          '&emsp;&emsp;<input type="checkbox" name="notify.desktop.new_thread"> New threads<br>'+
          '&emsp;&emsp;<input type="checkbox" name="notify.desktop.appear"> Appear threads<br>'+
          '&emsp;<input type="checkbox" name="notify.favicon"> Favicon<br>'+
          '&emsp;<input type="checkbox" name="notify.title.notify"> Show number of unread replies in title<br>'+
          '&emsp;&emsp;<input type="checkbox" name="notify.title.hide_zero"> Hide unread count in title bar when it is zero<br>'+
          '&emsp;<input type="checkbox" name="notify.sound.notify"> Sound'+
          '&emsp;&emsp;<button name="notify.sound.pause">Pause</button><br>'+
          '&emsp;&emsp;&emsp;<input type="radio" name="notify.sound.src" value="beep">Beep '+
          '&emsp;freq:<input type="text" name="notify.sound.beep_freq" size="4" style="text-align: right;"> '+
          'length:<input type="text" name="notify.sound.beep_length_f" size="4" style="text-align: right;"> '+
          'volume:<input type="text" name="notify.sound.beep_volume_f" size="4" style="text-align: right;"><br>'+
          '&emsp;&emsp;&emsp;<input type="radio" name="notify.sound.src" value="file">File '+
          '&emsp;<input type="file" accept="audio/*" name="notify.sound.file"><br>'+
          '&emsp;&emsp;<input type="checkbox" name="notify.sound.reply_to_me"> New replies to me<br>'+
          '&emsp;&emsp;<input type="checkbox" name="notify.sound.reply"> New replies<br>'+
          '&emsp;&emsp;<input type="checkbox" name="notify.sound.new_thread"> New threads<br>'+
          '&emsp;&emsp;<input type="checkbox" name="notify.sound.appear"> Appear threads<br>',
//          '3',
          'UIP tracker for 4chan:<br>'+
          '&emsp;<input type="checkbox" name="uip_tracker.on"> Show num of unique IPs after post No.<br>'+
          '&emsp;&emsp;<input type="checkbox" name="uip_tracker.posts"> Show num of posts<br>'+
          '&emsp;&emsp;<input type="checkbox" name="uip_tracker.deletion"> Show deleted posts\' No.<br>'+
          '&emsp;&emsp;Interval: <input type="text" name="uip_tracker.interval" size="3" style="text-align: right;">sec'+
          '&emsp;<input type="checkbox" name="uip_tracker.adaptive"> Adaptive<br>'+
          '&emsp;<input type="checkbox" name="uip_tracker.auto_open"> Open next thread automatically<br>'+
          '&emsp;&emsp;Conditions:<br>'+
          '&emsp;&emsp;&emsp;After <input type="text" name="uip_tracker.auto_open_th" size="3" style="text-align: right;">th post<br>'+
          '&emsp;&emsp;&emsp;OP contains <textarea style="height:1em" cols="20" name="uip_tracker.auto_open_kwd"></textarea><br>',
          'Command interface for overwriting preference<br>'+
          '&emsp;<textarea style="height:1em" cols="40" name="overwrite_site2_json_str"></textarea><br>'+
          '&emsp;<button name="JSON_ex">extract</button>'+
          '<button name="JSON_ex_full">extract_full</button>'+
          '&emsp;<button name="JSON_query">query</button>'+
          '&emsp;&emsp;<button name="JSON">JSON</button>'+
          '<span name="JSON_result"></span><br>'+
          '&emsp;<textarea style="height:1em" cols="40" name="overwrite_site2_eval_str"></textarea><br>'+
          '&emsp;<button name="EVAL">EVAL</button><br>',
//          '5',
          'Networking:<br>'+
          '&emsp;Cross domain connection:<br>'+
          '&emsp;&emsp;<input type="radio" name="catalog_cross_domain_connection" value="direct"> Direct connection<br>'+
          '&emsp;&emsp;<input type="radio" name="catalog_cross_domain_connection" value="indirect"> Indirect connection<br>'+
          '<!-- &emsp;&emsp;<input type="checkbox" name="catalog_fake_access"> Fake access made by human to avoid poor administration<br>'+
          '&emsp;&emsp;&emsp;(This causes heavier network traffic and server load,<br>'+
          '&emsp;&emsp;&emsp;but administrators can\'t see what script you are using)<br>'+
          '&emsp;Configuration:<br>'+
          '&emsp;&emsp;(To get faster feeling, you should check them all.)<br> -->'+
          '&emsp;Networking:<br>'+
          '&emsp;&emsp;load on demand for reducing initial network traffics<br>'+
          '&emsp;&emsp;&emsp;<input type="checkbox" name="catalog_draw_on_demand"> Threads<br>'+
          '&emsp;&emsp;&emsp;<input type="checkbox" name="catalog_load_on_demand"> HTMLs<br>'+
          '&emsp;&emsp;<input type="checkbox" name="catalog.health_indicator.on"> Health indicator, '+
          'history: <input type="text" name="catalog.health_indicator.max" size="2" style="text-align: right;"><br>',
          '&emsp;Localtime offset<input type="text" name="localtime_offset" size="2" style="text-align: right;"><br>'+
          'Share loaded html with other tabs to update<br>'+
          '&emsp;<input type="checkbox" name="info_server"> Broadcast loaded html to other tabs (server)<br>'+
          '&emsp;<input type="checkbox" name="info_client"> Listen other tab\'s broadcasting (client)<br>'+
          'Cloudflare<br>'+
          '&emsp;<input type="checkbox" name="cloudflare.auto_reload"> Auto reload at server error<br>'+
          '&emsp;&emsp;<input type="text" name="cloudflare.auto_reload_time" size="2" style="text-align: right;"> minutes after<br>'+
          '<br>'+
          '<input type="checkbox" name="tooltip.show"> Show tooltips<br>'+
          '&emsp;pop up delay: <input type="text" name="tooltip.popup_delay" size="6" style="text-align: right;"> ms<br>'+
          '&emsp;pop down delay: <input type="text" name="tooltip.popdown_delay" size="6" style="text-align: right;"> ms<br>'+
          'Misc.<br>'+
          '<input type="checkbox" name="catalog_auto_update_countdown"> Show count down to auto update<br>'+
          '<input type="checkbox" name="catalog_footer_ignore_my_own_posts"> Ignore my own posts at counting unread posts<br>'+
          '<input type="checkbox" name="pref2.KC.summer_time"> Summer time in KC<br>'+
          '<br>'+
          'Patches<br>'+
          '<input type="checkbox" name="patch.delayed_invoke.use"> Delayed invoke for 4chan on FF, '+
          '<input type="text" name="patch.delayed_invoke.sec" size="2" style="text-align: right;">sec.<br>',
          'Features<br>'+
          '<input type="checkbox" name="features.page"> Page<br>'+
          '<input type="checkbox" name="features.graph"> Graph<br>'+
//          '<input type="checkbox" name="features.setting"> Setting<br>'+
          '<input type="checkbox" name="features.setting2"> Setting2<br>'+
          '<input type="checkbox" name="features.postform"> Postform<br>'+
          '<input type="checkbox" name="features.catalog"> Catalog<br>'+
          '<input type="checkbox" name="features.listener"> Listener<br>'+
          '<input type="checkbox" name="features.uip_tracker"> UIP_tracker<br>'+
          '<input type="checkbox" name="features.thread_reader"> Thread Reader<br>'+
//          '<input type="checkbox" name="features.debug"> Debug<br>'+
          '',
          'CatChan<br>'+
          'Version 2015.11.29.0<br>'+
          '<a href="https://github.com/DogMan8/CatChan">GitHub</a><br>'+
          '<a href="https://github.com/DogMan8/CatChan/raw/master/CatChan.user.js">Get stable release</a><br>'+
          '<a href="https://github.com/DogMan8/CatChan/raw/develop/CatChan.user.js">Get BETA release</a><br>'+
          '<br><br>'+
          'Debug mode<br>'+
          '<input type="checkbox" name="debug_mode.0">'+
          '<input type="text" name="debug_mode.unread_count" size="30" style="text-align: right;">'+
          '<input type="checkbox" name="debug_mode.2">'+
          '<input type="checkbox" name="debug_mode.3">'+
          '<input type="checkbox" name="debug_mode.4">&emsp;'+
          '<input type="checkbox" name="debug_mode.5">'+
          '<input type="checkbox" name="debug_mode.parse_error">'+
          '<input type="checkbox" name="debug_mode.7"><br>'+
          '<input type="text" name="debug_mode.site2func" size="30" style="text-align: right;">'+
          '<button name="debug_site2">dump_site2</button>(ex: catalog_json2html3)'+
          '<input type="checkbox" name="debug_mode.site2func_expand"> expand func<br>'+
          '<input type="text" name="debug_mode.pfunc" size="30" style="text-align: right;">'+
          '<button name="debug_pfunc">dump_parse_funcs</button>(ex: 4chan:catalog_json)'+
          '<input type="checkbox" name="debug_mode.pfunc_expand"> expand func<br>'+
          '<input type="text" name="debug_mode.pfunc_all" size="30" style="text-align: right;">'+
          '<button name="debug_pfunc_all">find_parse_funcs</button>(ex: op_img_url)'+
          '<input type="checkbox" name="debug_mode.pfunc_all_expand"> expand func<br>'+
          '<input type="checkbox" name="debug_mode.9"><br>'+
          '<input type="checkbox" name="debug_mode.10">'+
          '<input type="checkbox" name="debug_mode.11">'+
          '<input type="checkbox" name="debug_mode.12">'+
          '<input type="checkbox" name="debug_mode.13">'+
          '<input type="checkbox" name="debug_mode.14"><br>'+
          'Test mode<br>'+
          '<input type="checkbox" name="test_mode.0">'+
          '<input type="checkbox" name="test_mode.1">'+
          '<input type="checkbox" name="test_mode.2">'+
          '<input type="checkbox" name="test_mode.3">'+
          '<input type="checkbox" name="test_mode.4">&emsp;'+
          '<input type="checkbox" name="test_mode.5">'+
          '<input type="checkbox" name="test_mode.6">'+
          '<input type="checkbox" name="test_mode.7">'+
          '<input type="checkbox" name="test_mode.8">'+
          '<input type="checkbox" name="test_mode.9"><br>'+
          '<input type="checkbox" name="test_mode.10">'+
          '<input type="checkbox" name="test_mode.11">'+
          '<input type="checkbox" name="test_mode.12">'+
          '<input type="checkbox" name="test_mode.13">'+
          '<input type="checkbox" name="test_mode.14">&emsp;'+
          '<input type="checkbox" name="test_mode.15">'+
          '<input type="checkbox" name="test_mode.16">'+
          '<input type="checkbox" name="test_mode.17">'+
          '<input type="checkbox" name="test_mode.18">'+
          '<input type="checkbox" name="test_mode.19"><br>'+
          '<input type="checkbox" name="test_mode.20">'+
          '<input type="checkbox" name="test_mode.21">'+
          '<input type="checkbox" name="test_mode.22">'+
          '<input type="checkbox" name="test_mode.23">'+
          '<input type="checkbox" name="test_mode.24">&emsp;'+
          '<input type="checkbox" name="test_mode.25">'+
          '<input type="checkbox" name="test_mode.26">'+
          '<input type="checkbox" name="test_mode.27">'+
          '<input type="checkbox" name="test_mode.28">'+
          '<input type="checkbox" name="test_mode.29"><br>'+
          '<input type="checkbox" name="test_mode.tips">'+
          '<input type="text" name="test_mode.num" size="6" style="text-align: right;"><br>',
        ],
        html_common:
          '<br><button name="close">close</button>'+
          '&emsp;<button name="save">save</button>'+
          '<button name="load_default">load_default</button>'+
          '&emsp;<button name="load_samples">setting_samples</button>',
//        onchange_event : function(){
//          pref_func.apply_prep(this,true);
//          if (pref_func.settings.onchange_funcs[this.name]) pref_func.settings.onchange_funcs[this.name]();
//        },
        tag_gen: null,
        health_indicator: null,
        onchange_funcs : {
          'uip_tracker.on' : uip_tracker_init,
          'catalog.health_indicator.on' : function(){if (pref_func.health_indicator) cnst.show_hide(pref_func.health_indicator);},
          'settings.indexing' : function(){
            var pn13_1 = pref_func.settings.pn13.childNodes[1];
            if (pref.tooltip.show && pn13_1.innerHTML) pref_func.tooltips.remove_hier(pn13_1);
            pref_func.settings.files_store();
            pn13_1.innerHTML = pref_func.settings.htmls[pref.settings.indexing] + pref_func.settings.html_common;
            pref_func.add_onchange(pn13_1,pref_func.settings.onchange_funcs);
            pref_func.apply_prep(pn13_1,false);
            if (pref.tooltip.show) pref_func.tooltips.add_hier(pn13_1);
          },
          'tag.scan' : function(){
            pref.catalog.board.board_tags = true;
            pref_func.settings.onchange_funcs['tag.generate_caller']('tag.scan');
          },
          'tag.same_tag_refresh' : function(){
            pref.catalog.board.board_tags_same = true;
            pref_func.settings.onchange_funcs['tag.generate_caller']('tag.same_tag_refresh');
          },
          'tag.generate_caller' : function(src){
            http_req.get('tag','8chan','https://'+site2['8chan'].domain_url+'/boards.json',pref_func.settings.onchange_funcs['tag.generate_callback'],false,false,src);
            if (pref_func.settings.pn13) pref_func.settings.apply_pn13_1();
          },
          'tag.generate_callback' : function(key,value,arg){
            site3['8chan'].boards = ('response' in value)? value.response : JSON.parse(value.responseText);
            pref_func.settings.onchange_funcs['tag.re_generate'](arg);
          },
          'tag.re_generate' : function(arg){
            var str = catalog_obj.scan_tags_common(site3['8chan'].boards,'name="tag.gen"');
            if (!pref_func.settings['tag_gen']) {
              if (arg!=='tag.same_tag_refresh') {
                var html = '<div><button name="tag.scan">Refresh</button><br>'+
                  '<textarea style="height:1em" cols="20" name="tag.gen_str"></textarea>'+
                  '<button name="tag.gen_add">Add to list</button></div><div>' + str +'</div>';
                cnst.make_popup(pref_func.settings,'tag_gen',html,pref_func.settings.onchange_funcs);
                var pn = pref_func.settings['tag_gen'].childNodes[1];
//                pn.getElementsByTagName('textarea')[0].value='board_group_name';
                pn.style.height = '200px';
                pn.style.width  = '200px';
                pn.style.overflow = 'auto';
                pn.style.resize = 'both';
                cnst.bottom_top(pn);
              }
            } else pref_func.settings['tag_gen'].childNodes[1].childNodes[1].innerHTML = str;
            if (pref_func.settings['tag_gen']) pref_func.add_onchange(pref_func.settings['tag_gen'].childNodes[1].childNodes[1],pref_func.settings.onchange_funcs);

            var str = ''
            var obj = site3['8chan'].boards;
            var myself = 0;
            while (myself<obj.length-1 && site.board!=='/'+obj[myself].uri+'/') myself++;
            for (var i=0;i<obj[myself].tags.length;i++) {
              var key = obj[myself].tags[i];
              str = str + '#' + key;
              for (var j=0;j<obj.length;j++)
                for (var m=0;m<obj[j].tags.length;m++)
                  if (obj[j].tags[m]===key) str = str + ',8chan/' + obj[j].uri + '/';
              str = str + '\n';
            }
            pref_func.catalog_board_list_str_bt_same = str;

            pref_func.catalog_board_list_str_bt = '';
            pref_func.settings.onchange_funcs['board_sel_refresh']();
          },
//          'catalog.tag.ignore' : function(){pref_func.settings.onchange_funcs['tag.re_generate']();},
//          'catalog.tag.max' : function(){pref_func.settings.onchange_funcs['tag.re_generate']();},
//          'tag.gen_str' : function(){pref_func.settings.onchange_funcs['tag.gen']();},
          'tag.gen' : function(){
            var cbxes = pref_func.settings['tag_gen'].childNodes[1].getElementsByTagName('input');
            var str = '';
            var str_name = pref_func.settings['tag_gen'].childNodes[1].getElementsByTagName('textarea')[0].value;
            var obj = site3['8chan'].boards;
            for (var i=0;i<cbxes.length;i++)
              if (cbxes[i].checked) {
                var key = cbxes[i].nextSibling.textContent.replace(/ [0-9]*: /,'');
                if (str_name==='') str_name = '#' + key;
                for (var j=0;j<obj.length;j++)
                  for (var m=0;m<obj[j].tags.length;m++)
                    if (obj[j].tags[m]==key) str = str + '8chan/' + obj[j].uri + '/,';
              }
            pref_func.catalog_board_list_str_bt = str_name + ',' + str;
            pref_func.settings.onchange_funcs['board_sel_refresh']();
//            pref_func.str2obj('catalog_board_list_str');
//            if (pref_func.board_sel) pref_func.apply_prep(pref_func.board_sel,false);
          },
          'tag.gen_add' : function(){
            pref_func.settings.onchange_funcs['tag.gen']();
            pref_func.settings.onchange_funcs['tag.add_to_list'](pref_func.catalog_board_list_str_bt);
          },
          'tag.recommendation_add' : function(){
            pref_func.settings.onchange_funcs['tag.add_to_list'](pref_func.catalog_board_list_str_or);
          },
          'tag.add_to_list' : function(str){
            if (str!=='') {
              if (pref.catalog_board_list_str.search(/\n$/)==-1) pref.catalog_board_list_str = pref.catalog_board_list_str + '\n';
              pref.catalog_board_list_str = pref.catalog_board_list_str + str + '\n';
              if (pref_func.settings.pn13) pref_func.settings.apply_pn13_1();
//              pref_func.str2obj('catalog_board_list_str');
//              if (pref_func.board_sel) pref_func.apply_prep(pref_func.board_sel,false);
              pref_func.settings.onchange_funcs['board_sel_refresh']();
            }
          },
          'board_sel_refresh' : function(){
            pref_func.str2obj('catalog_board_list_str');
            if (pref_func.board_sel) pref_func.apply_prep(pref_func.board_sel,false);
            pref_func.board_sel.onblur();
          },
          'JSON' : function() {
//          pref_func.apply_prep(pref_func.settings.pn13.getElementsByTagName('TEXTAREA')['overwrite_site2_json_str'],true);
            pref_func.site2_json();
          },
          'JSON_query' : function() {
            pref_func.site2_json(true);
          },
          'JSON_ex' : function() {
            pref_func.site2_json_ex(false);
            pref_func.settings.apply_pn13_1();
          },
          'JSON_ex_full' : function() {
            pref_func.site2_json_ex(true);
            pref_func.settings.apply_pn13_1();
          },
          'EVAL' : function() {
//            pref_func.apply_prep(pref_func.settings.pn13.getElementsByTagName('TEXTAREA')['overwrite_site2_eval_str'],true);
            pref_func.site2_eval();
          },
          'close': function(){pref_func.settings.show_hide();},
//          'save' : function(){if (localStorage) localStorage[pref.script_prefix+'.pref']=JSON.stringify(pref);},
          'save' : function(){
            var pref_test = pref_default();
            pref_func.obj_elim_the_same(pref_test,pref);
            if (localStorage) localStorage[pref.script_prefix+'.pref']=JSON.stringify(pref_test);
          },
          'load_default' : function(){
            var pref_def = pref_default();
            delete pref_def.settings.indexing;
            delete pref_def.catalog_board_list_sel;
            delete pref_def.catalog.filter;
            pref_func.pref_overwrite(pref,pref_def);
//            var idx = pref.settings.indexing;
//            pref = pref_default();
            pref_func.obj_init();
//            pref.settings.indexing = idx;
//            pref_func.settings.onchange_funcs['settings.indexing']();
            pref_func.settings.apply_pn13_1();
            pref_func.settings.apply_pn13_1(true);  // writing to sessionStrage.
          },
          'load_samples' : function(){pref_func.pref_samples.init();},
          'notify.sound.file' : function(myself){
            if (myself.name==='notify.sound.file') pref.notify.sound.src='file';
            notifier.sound.src(pref_func.settings.pn13.getElementsByTagName('input')['notify.sound.file'].files[0]);
            pref_func.settings.apply_pn13_1();
          },
          'catalog_triage_str' : function(){
            if (catalog_obj && catalog_obj.catalog_func()!==null) catalog_obj.catalog_func().remake_triage();
          },
          'catalog_footer_show_nof_rep'       : 'catalog_footer',
          'catalog_footer_show_nof_rep_to_me' : 'catalog_footer',
          'catalog_footer_show_site_name'     : 'catalog_footer',
          'catalog_footer_show_board_name'    : 'catalog_footer',
          'catalog_footer_show_thread_no'     : 'catalog_footer',
          'catalog_footer_show_flag'          : 'catalog_footer',
          'catalog_footer_show_page'          : 'catalog_footer',
          'catalog_footer_design'             : 'catalog_footer',
          'catalog_footer_show_tag'           : 'catalog_footer',
          'catalog.footer.ctime'              : 'catalog_footer',
          'catalog.footer.btime'              : 'catalog_footer',
          'catalog.footer.ptime'              : 'catalog_footer',
          'catalog_footer' : function(){
            if (catalog_obj && catalog_obj.catalog_func()!==null) catalog_obj.catalog_func().update_all_footers();
          },
          'thread_reader.use' : thread_reader_init,
          'catalog.appearance.titleBar.settings'        : 'catalog.appearance.titleBar.filter',
          'catalog.appearance.titleBar.refresh'         : 'catalog.appearance.titleBar.filter',
          'catalog.appearance.titleBar.num_of_pages'    : 'catalog.appearance.titleBar.filter',
          'catalog.appearance.titleBar.boards_selector' : 'catalog.appearance.titleBar.filter',
          'catalog.appearance.titleBar.filter' : function(myself){
            if (catalog_obj && catalog_obj.catalog_func()!==null) catalog_obj.catalog_func().pn12_0_2.getElementsByTagName('*')[myself.name.substr(myself.name.lastIndexOf('.')+1)].style.display = (myself.checked)? '' : 'none';
          },
          'catalog_size_text_height': 'catalog_size_width', 
          'catalog_size_text_width': 'catalog_size_width',
          'catalog_size_height': 'catalog_size_width',
          'catalog_size_width': function(myself){
            if (catalog_obj && catalog_obj.catalog_func()!==null) catalog_obj.catalog_func().catalog_resized(myself);
          },
          'catalog_click_area': function(){
            if (pref_func.style_sheet) {
              if (pref_func.style_sheet.cssRules[2]) pref_func.style_sheet.deleteRule(2);
              pref_func.settings.onchange_funcs['catalog_click_area_add_rule']();
            }
          },
          'catalog_click_area_add_rule': function(){
////            var tgt  = site2[site.nickname].parse_funcs[site.whereami+'_html']['class_'+((pref.catalog_click_area==='entire')? 'thread' : 'thumbnail')]; // working code.
////            if (!tgt) tgt = 'dummy';
////            pref_func.style_sheet.insertRule('.'+tgt+' {cursor: pointer}',2);
            pref_func.style_sheet.insertRule('.'+pref.script_prefix+((pref.catalog_click_area==='entire')? '_thread' : '_thumbnail')+' {cursor: pointer}',2);
          },
//          'sound.beep_length_f' : notifier.sound.make_beep,
//          'sound.beep_volume_f' : notifier.sound.make_beep,
//          'sound.beep_freq'     : notifier.sound.make_beep,
//          'sound.src'           : notifier.sound.src,
//          'catalog.order.reply_to_me' : catalog_func.onchange_funcs['catalog.indexing'](),
//          'catalog.order.reply'  : catalog_func.onchange_funcs['catalog.indexing'](),
//          'catalog.order.watch'  : catalog_func.onchange_funcs['catalog.indexing'](),
//          'catalog.order.sticky' : catalog_func.onchange_funcs['catalog.indexing'](),
          'virtualBoard.p_board' : function(){liveTag.update_boardlist(true);},
          'virtualBoard.p_remove' : 'virtualBoard.p_board',
          'virtualBoard.max' : 'virtualBoard.p_board',
          'virtualBoard.show' : 'virtualBoard.p_board',
          'easy.virtualBoard_10' : function(myself){pref_func.pref_samples.onclick_event.call(myself);},
          'easy.virtualBoard_1' : 'easy.virtualBoard_10',
          'easy.virtualBoard_8_50' : 'easy.virtualBoard_10',
          'easy.virtualBoard_8_100' : 'easy.virtualBoard_10',
          'easy.virtualBoard_8_500' : 'easy.virtualBoard_10',
          'easy.virtualBoard_8_all' : 'easy.virtualBoard_10',
          'easy.posts_0h' : 'easy.virtualBoard_10',
          'easy.posts_24h' : 'easy.virtualBoard_10',
          'easy.posts_48h' : 'easy.virtualBoard_10',
          'easy.embed_index' : 'easy.virtualBoard_10',
          'easy.embed_index_lazy' : 'easy.virtualBoard_10',
          'easy.embed_index_infinite' : 'easy.virtualBoard_10',
          'easy.embed_index_backwash' : 'easy.virtualBoard_10',
          'virtualBoard.scanStart' : function(){if (catalog_obj && catalog_obj.catalog_func()!==null) catalog_obj.catalog_func().catalog_liveTag_scan_site();},
          'virtualBoard.scanStop' : function(){if (catalog_obj && catalog_obj.catalog_func()!==null) catalog_obj.catalog_func().catalog_liveTag_scan_cancel();},
          'debug_site2': function(){if (pref.debug_mode.site2func) common_func.debug_site2func(pref.debug_mode.site2func);},
          'debug_pfunc': function(){if (pref.debug_mode.pfunc) common_func.debug_parse_funcs_entry(pref.debug_mode.pfunc);},
          'debug_pfunc_all': function(){if (pref.debug_mode.pfunc_all) common_func.debug_parse_funcs_all(pref.debug_mode.pfunc_all);},
          'liveTag.ex_list_str' : function(){liveTag.ex_list_changed();},
        }
      }
    };
  })();
  pref_func.settings.onchange_funcs.entry_func = (function(myself){
    return function(e){
      pref_func.apply_prep(this,true);
      if (myself[this.name]) myself[this.name](this);
    }
  })(pref_func.settings.onchange_funcs);

  pref_func.settings.onchange_funcs['catalog.board.recommendation'] = pref_func.settings.onchange_funcs['board_sel_refresh']; // to reduce footprint.
  pref_func.settings.onchange_funcs['catalog.board.board_tags']     = pref_func.settings.onchange_funcs['board_sel_refresh'];
  pref_func.settings.onchange_funcs['catalog_board_list_str']       = pref_func.settings.onchange_funcs['board_sel_refresh'];
  pref_func.settings.onchange_funcs['catalog.tag.ignore'] = pref_func.settings.onchange_funcs['tag.re_generate'];
  pref_func.settings.onchange_funcs['catalog.tag.max']    = pref_func.settings.onchange_funcs['tag.re_generate'];
  pref_func.settings.onchange_funcs['tag.gen_str']        = pref_func.settings.onchange_funcs['tag.gen'];

  var options = {
    func0_prep: function(){},
    func0_exe : function(){}
  };

  var notifier = (function(){
    var sound = (function(){
      var wav_str;
      var audio;
      function make_beep(){
        wav_str = [];
        var dl = header_prep_monaural8(pref.notify.sound.beep_length_f);
        data_prep_monaural8(pref.notify.sound.beep_freq,dl,pref.notify.sound.beep_volume_f);
        for (var i=0;i<wav_str.length;i++) if (wav_str[i].length==1) wav_str[i] = '0'+wav_str[i];
        audio = new Audio('data:audio/wav,%'+wav_str.join('%'));
      }
      make_beep();

      function header_prep_monaural8(period) {
        var dl=Math.floor(period*44100);
        var header_size=46;
        header_add(0x52494646,4,1);     //riff
        header_add(dl+header_size,4,0); //size
        header_add(0x57415645,4,1);     //WAVE
        header_add(0x666d7420,4,1);     //fmt
        header_add(0x12,4,0);           //size of fmt
        header_add(0x01,2,0);           //linearPCM
        header_add(0x01,2,0);           //Stereo
        header_add(44100,4,0);          //44.1kHz
        header_add(44100,4,0);          //176400 bit/sec
        header_add(1,2,0);              //block size, 4Byte
        header_add(8,2,0);              //bit/sample
        header_add(0,2,0);              //size of ext
  //      header_add(0x66616374,4,1);     //fact
  //      header_add(4,4,0);              //size of fact
  //      header_add(0xdbcd5a00,4,1);     //data of fact
        header_add(0x64617461,4,1);     //data
        header_add(dl,4,0);             //size of data
        return dl;
      }

      function header_add(val,num,big_endian) {
        if (big_endian==1) for (var i=0;i<num;i++) wav_str.push('');
        for (i=0;i<num;i++) {
          if (big_endian==1) wav_str[wav_str.length-1-i] = (val%0x100).toString(16);
          else wav_str.push((val%0x100).toString(16));
          val = Math.floor(val/0x100);
        }
      }

      function data_prep_monaural8(freq,period,vol){
        var pi2 = 3.141592654*2;
        vol *=127;
        for (var i=0;i<period;i++) {
          var val = Math.floor(Math.sin(pi2*freq*i/44100)*vol+0x80)%0x100;
          wav_str.push(val.toString(16));
        }
      }
      function make_beep_play(){
        make_beep();
        if (pref.notify.sound.notify && pref.notify.sound.src==='beep') audio.play();
      }
      function change_src(file){
        audio.pause();
        if (pref.notify.sound.src==='beep') make_beep();
        else if (file) audio = new Audio(URL.createObjectURL(file));
        if (pref.notify.sound.notify) audio.play();
      }
      pref_func.settings.onchange_funcs['notify.sound.beep_length_f'] = make_beep_play;
      pref_func.settings.onchange_funcs['notify.sound.beep_volume_f'] = make_beep_play;
      pref_func.settings.onchange_funcs['notify.sound.beep_freq'    ] = make_beep_play;
      pref_func.settings.onchange_funcs['notify.sound.beep_freq'    ] = make_beep_play;
      pref_func.settings.onchange_funcs['notify.sound.src'          ] = pref_func.settings.onchange_funcs['notify.sound.file'];
      pref_func.settings.onchange_funcs['notify.sound.pause'        ] = function(){audio.pause();};
  //    pref_func.settings.onchange_funcs['notify.sound.file'         ] = change_src;

      return {
  //      make_beep : function(){make_beep();if (pref.notify.sound.notify && pref.notify.sound.src==='beep') audio.play();},
        play : function(){audio.play();},
  //      src  : function(file){audio = new Audio(URL.createObjectURL(file));},
        src  : function(file){change_src(file);},
      }
    })();

    var favicon = (function(){
      var favicon;
      var favicon_current;
      var title;
      var title_current;
      var title_org;
      function favicon_set(favicon_next){
        if (!favicon) favicon = site2[site.nickname].favicon.get_favicon();
        if (favicon_current!==favicon_next) {
          var str = site2[site.nickname].favicon[favicon_next];
          if (str[0]!=='/') str = 'data:image/'+str;
          favicon.setAttribute('href',str);
          favicon_current = favicon_next;
        }
      }
//      function favicon_set(str){ // working code.
//        if (!favicon) favicon = site2[site.nickname].favicon.get_favicon();
//        if (str[0]!=='/') str = 'data:image/'+str;
//        favicon.setAttribute('href',str);
//      }

// [ForInStatement is not fast case]
// http://www.html5rocks.com/en/tutorials/performance/mystery/?redirect_from_locale=ja
////      var nof_rtm = 0;
////      var nof_r   = 0;
////      function count(th){
////        if (th[0]>=0) {
////          nof_rtm += th[1];
////          nof_r   += th[2];
////        }
////      }
      var CountUp = function(){
        this.nrtm = 0;
        this.nr   = 0;
      }
      CountUp.prototype = {
        count: function(th){
          if (th[0]!==0) {
            this.nrtm += th[1];
            this.nr   += th[2];
          }
        }
      }
      function set(){
        var sum = new CountUp();
        if (pref.liveTag.watch_all) {
          for (var d in liveTag.mems) {
            for (var b in liveTag.mems[d]) {
              if (liveTag.mems[d][b].nr_dirty) {
                var sum_sub = new CountUp();
                for (var t in liveTag.mems[d][b]) sum_sub.count(liveTag.mems[d][b][t][2]);
                liveTag.mems[d][b].nrtm = sum_sub.nrtm;
                liveTag.mems[d][b].nr   = sum_sub.nr;
                liveTag.mems[d][b].nr_dirty = false;
              }
              sum.count([1,liveTag.mems[d][b].nrtm, liveTag.mems[d][b].nr]);
        }}} else {
          var threads = cataLog.threads;
          if (threads) for (var name in threads) sum.count(threads[name][19]);
        }
        if (pref.notify.favicon) {
          var favicon_next = (sum.nrtm!=0)? 'reply_to_me' :
                             (sum.nr!=0)?   'reply' :
                             'none';
          favicon_set(favicon_next);
        }
        if (pref.notify.title.notify) {
          if (sum.nrtm + sum.nr !=0 || !pref.notify.title.hide_zero) title_set(((pref.catalog_footer_show_nof_rep_to_me)? sum.nrtm + '/' + sum.nr : '('+sum.nr+')') + ' - ');
          else title_set('');
        }
      }
      function title_set(str){
        if (!title) {
          title = site2[site.nickname].favicon.get_title();
          title_org = title.innerHTML;
        }
        if (title_current!==str) {
          title.innerHTML = str + title_org;
          title_current = str;
        }
      }
      return {
//        set : set,
        set : new DelayBuffer(set, 1000).binded_delayed_do(),
      }
    })();
    var desktop = (function(){
      function get_permission(){
        if (Notification && Notification.permission !== 'granted') {
          Notification.requestPermission(function (status) {
            if (Notification.permission !== status) {
              Notification.permission = status;
            }
          });
        }
        return Notification && Notification.permission==='granted';
      }
      get_permission();

//      var dtns = {};
      var dtns = [];
      function show(name,obj,num){
        if (dtns.length < pref.notify.desktop.limit)
          if (Notification.permission === 'granted' || get_permission()) show_1(name,obj,num);
      }
//      function show(name,obj,num){ // working code.
//        if (dtns.length>pref.notify.desktop.limit) return;
//        if (Notification.permission === 'granted') show_1(name,obj,num);
//        else if (Notification && Notification.permission !== 'denied') {
//          Notification.requestPermission(function (status) {
//            if (Notification.permission !== status) {
//              Notification.permission = status;
//            }
//            if (status === 'granted') show_1(name,obj,num);
//          })
//        }
//      }
      var pn = document.createElement('div');
      function show_1(name,objs,num){
        var obj;
        if (num>=0) {
          obj = {icon: objs[num].op_img_url,
                 body: objs[num].com || '',
                 time: objs[num].time,
                 reply_to_me: objs[num].reply_to_me};
        } else obj = objs;
        obj.title = ( // (obj.appear_thread)? 'Appear thread ' :
                     (obj.new_thread)? 'New Thread ' :
                     (obj.reply_to_me && pref.notify.desktop.reply_to_me)? 'New Reply to You in ' :
                                                                           'New Reply in '         ) + name;
//        if (obj.tag) obj.tag = 'CatChan/' + obj.tag;
        obj.tag = pref.script_prefix+'/' + name + ', '+(objs.length-num-1);
        pn.innerHTML = obj.body;
//        var dtn = new Notification(obj.title,{tag:obj.tag, body:pn[brwsr.innerText], icon:obj.icon});
        var dtn = new Notification(obj.title,{tag:obj.tag, body:pn[brwsr.innerText].trim(), icon:obj.icon}); // trim for KC
        dtn.onclick = win_focus;
//        dtn.onclose = close_1;
        var id = (pref.notify.desktop.lifetime!=0)? setTimeout(close_1, pref.notify.desktop.lifetime*1000) : null;
        dtns[dtns.length] = [dtn, id];
//console.log(dtns.length);
//        dtns[obj.tag] = dtn;
//        if (pref.notify.desktop.lifetime!=0) setTimeout(function(){dtn.close();delete dtns[obj.tag];},pref.notify.desktop.lifetime*1000); // can't call this in setTimeout without 'use strict'
      }
      function close_1(){dtns.shift()[0].close();}
      function win_focus(){window.focus();for (var i=dtns.length-1;i>=0;i--) if (dtns[i][0]===this || i==0) {if (dtns[i][1]) clearTimeout(dtns[i][1]);dtns.splice(i,1);break;}}
      function close_all(){while (dtns.length>0) {if (dtns[0][1]) clearTimeout(dtns[0][1]);close_1();}}
//      function win_focus(){window.focus();clearTimeout(dtns.shift()[1]);};
//      function close_all(){while (dtns.length>0) close_1();}
////      function win_focus(){window.focus()};
////      function close_all(){
////        for (var i in dtns) dtns[i].close();
////      }
      window.addEventListener('beforeunload', close_all, false);
      return {
        show : show,
      }
    })();
    return {
      sound:   sound,
      favicon: favicon,
      desktop: desktop,
      changed: function(name,threads){
        if (pref.notify.favicon || pref.notify.title.notify) favicon.set(threads);
//threads[name][19][5] = false; // for debug.
        if (!threads[name][19][5] && threads[name][19][4] && threads[name][19][4].length!=0) { // I think that threads[name][19][4] is redundant, but error occured, so patched.
          var sound_flag = false;
          var dt = (pref.notify.desktop.show_last)? 0 : threads[name][19][4].length-1;
          for (var i=threads[name][19][4].length-1;i>=0;i--) {
            if (pref.notify.sound.reply || (pref.notify.sound.reply_to_me && threads[name][19][4][i].reply_to_me)) sound_flag = true;
            if (i<=dt && pref.notify.desktop.notify)
              if (pref.notify.desktop.reply || (pref.notify.desktop.reply_to_me && threads[name][19][4][i].reply_to_me)) desktop.show(name,threads[name][19][4],i, true);
          }
          if (pref.notify.sound.notify && sound_flag) notifier.sound.play();
        }
//console.log(threads[name][19][4].length);
      },
////      changed: function(name,threads){
////        if (pref.notify.favicon) favicon.set(threads);
////        var sound_flag = false;
//////threads[name][19][5] = false; // for debug.
////        if (!threads[name][19][5] && threads[name][19][4] && threads[name][19][4].length!=0) { // I think that threads[name][19][4] is redundant, but error occured, so patched.
////          if (pref.notify.desktop.notify) {
////            var i = (pref.notify.desktop.show_last)? 0 : threads[name][19][4].length-1;
////            while (i>=0) {
////              if (i==0 || !pref.notify.desktop.show_last)
////                if (pref.notify.desktop.reply || (pref.notify.desktop.reply_to_me && threads[name][19][4][i].to_me)) desktop.show(name,threads[name][19][4],i);
////              i--;
////            }
////          }
////          for (var i=0;i<threads[name][19][4].length;i++) if (pref.notify.sound.reply || (pref.notify.sound.reply_to_me && threads[name][19][4][i].to_me)) sound_flag = true;
////        }
////        if (pref.notify.sound.notify && sound_flag) notifier.sound.play();
//////console.log(threads[name][19][4].length);
////      },
////      appeared: function(names,threads){ // working code.
//////        if (pref.notify.sound.notify) notifier.sound.play();
////        if (pref.notify.favicon || pref.notify.title.notify) favicon.set(threads);
////        var sound_flag = false;
////        for (var i=0;i<names.length;i++) {
////          var name = names[i];
//////          if (threads[name][19][0]<0) { // 'changed' shall not be issued.
//////            if (pref.notify.desktop.new_thread && threads[name][19][8]) desktop.show(name,[{new_thread:true, body:threads[name][0].innerHTML}],0);
////            var dbt = common_func.name2domainboardthread(name,true);
//////            if (pref.notify.desktop.notify && (pref.notify.desktop.appear || (pref.notify.desktop.new_thread && threads[name][19][8])))
////            if (pref.notify.desktop.notify &&   ((pref.notify.desktop.appear && !(threads[name][19][0]!==0 && (pref.notify.desktop.reply || pref.notify.desktop.reply_to_me)))
////                                              || (pref.notify.desktop.new_thread && threads[name][19][8])))
//////              desktop.show(name,[{new_thread:threads[name][19][8], body:threads[name][0].innerHTML, icon:site2[dbt[0]].get_op_image_url(threads[name][0],threads[name][18])}],0);
////              desktop.show(name,{new_thread:threads[name][19][8], body:threads[name][0].innerHTML, icon:threads[name][26]},-1);
////            if (pref.notify.sound.appear || (pref.notify.sound.new_thread && threads[name][19][8])) sound_flag = true;
////        }
////        if (pref.notify.sound.notify && sound_flag) notifier.sound.play();
////      }
      appeared: function(th, new_thread){
        var threads = cataLog.threads;
        if (pref.notify.favicon || pref.notify.title.notify) favicon.set(threads);
        var watch = liveTag.mems[th.domain][th.board][th.no][2];
        if (pref.notify.desktop.notify && ((pref.notify.desktop.appear && !(watch[0]!==0 && (pref.notify.desktop.reply || pref.notify.desktop.reply_to_me)))
                                            || (pref.notify.desktop.new_thread && new_thread)))
          desktop.show(th.key,{new_thread:new_thread, body:th.txt, icon:th.op_img_url},-1);
        if (pref.notify.sound.notify && (pref.notify.sound.appear || (pref.notify.sound.new_thread && new_therad))) notifier.sound.play();
      }
    }
  })();

  var common_func = {
    overwrite_prop: function(dst,src){
      for (var i in src) {
        if (src[i]===undefined && dst[i]) delete dst[i];
        else if (typeof(dst[i])==='object' && typeof(src[i])==='object') common_func.overwrite_prop(dst[i],src[i]);
        else dst[i] = src[i];
      }
    },
    name2domainboardthread: function(name,fill){
//      var thread = name.replace(/[^\/]*\//g,'');
//      var domain = name.replace(/\/.*/,'');
//      var board  = name.replace(new RegExp('^'+domain),'').replace(new RegExp(thread+'$'),'');

//      name = new String(name); // not tested.
      var thread = name.substr(name.lastIndexOf('/')+1);
      var domain = name.substr(0,name.indexOf('/'));
      var board  = name.substr(domain.length,name.length-thread.length-domain.length);
      if (thread===domain)
        if (thread.search(/[^0-9]/)!=-1) thread ='';
        else domain = '';
      if (fill) {
        if (domain==='') domain = site.nickname;
        if (board==='') board = site.board;
      }
      return [domain,board,thread];
    },
    name2dbt: (function(){
      var type = { c:'catalog_html',
                   j:'catalog_json',
                   p:'page_html',
                   q:'page_json',
                   t:'thread_json',
//                   0:'thread_html' // default
                 };
      return function(name){
        var dbt = this.name2domainboardthread(name,true);
        if (dbt[2][0].search(/[A-z]/)!=-1) {
          dbt[3] = type[dbt[2][0]];
          dbt[2] = dbt[2].substr(1);
        } else dbt[3] = 'thread_html';
        return dbt;
      }
    })(),
//    fullname2dbt: function(name){ // slow
//      var dbt = name.split('/');
//      dbt[1] = '/'+dbt[1]+'/';
//      return dbt;
//    },
    fullname2dbt: function(name){
      var thread = name.substr(name.lastIndexOf('/')+1);
      var domain = name.substr(0,name.indexOf('/'));
      var board  = name.substr(domain.length,name.length-thread.length-domain.length);
      return [domain,board,thread];
    },
    dom_addEventListener: function(obj, dom, kwd, func){
      dom.addEventListener(kwd, func, false);
      obj[obj.length] = [dom, kwd, func];
    },
    dom_removeEventListener: function(obj, dom, kwd, func){
      for (var i=obj.length-1;i>=0;i--) {
        if ((!dom || dom===obj[i][0]) && (!kwd || kwd===obj[i][1]) && (!func || func===obj[i][2])) {
          obj[i][0].removeEventListener(obj[i][1], obj[i][2], false);
          obj.splice(i,1);
        }
      }
    },
    dom_addAttribute: function(dom,attr,val){
      var val_old = dom.getAttribute(attr);
      if (val_old) val = val_old + ' ' + val;
      dom.setAttribute(attr,val);
    },
    Triage: function(str,args){
      var tooltips = {
        'NONE': ['Don\'t hide this thread.',true],
        'KILL': ['Hide this thread permanently.',true],
        'TIME': ['Hide this thread until it gets new replies.',true],
        'WATCH': ['Watch this thread and mark as I\'ve read all posts so far.', false],
        'UNWATCH': ['Unwatch this thread.', false],
        'UNDO': ['Undo last modification.', false],
        'GO': ['Open this thread.', false]
      }
        var pn = document.createElement('div');
        pn.name = (args.name)? args.name : '';
//        pn_triage.style.position = 'absolute';
//        pn_triage.name = 'pn_catalog_triage';
        pn.className = 'catalog_triage_parent';
        var lines = str.replace(/\/\/.*/mg,'').split('\n');
        str = [];
        for (var i=lines.length-1;i>=0;i--) if (lines[i]==='') lines.splice(i,1);
        var triage_style_replace_list = (!brwsr.ff)? ['background','background-color'] : [];
        for (var i=0;i<lines.length;i++) str[i] = lines[i].split(',');
        for (var i=0;i<str.length;i++) {
          for (var j=0;j<str[i].length;j+=3) {
            var triage_button = document.createElement('button');
            triage_button.innerHTML = str[i][j+1];
            triage_button.name = pn.name + '('+i+','+j+')';
            triage_button.className = 'catalog_triage_button';
            var triage_styles = (str[i][j+2])? str[i][j+2].split(';') : [];
            for (var k=0;k<triage_styles.length;k++) {
              var style_str = triage_styles[k].replace(/:.*/,'');
              for (var m=0;m<triage_style_replace_list.length;m+=2) style_str = style_str.replace(triage_style_replace_list[m],triage_style_replace_list[m+1]);
              triage_button.style[style_str] = triage_styles[k].replace(/[^:]*:/,'');
            }
//            triage_button.onclick = triage_factory(i,j);
            triage_button.onclick = args.onclick;
            pn.appendChild(triage_button);
            if (args.wheelpatch) triage_button.onmousewheel = args.wheelpatch;
            if (pn.name) pref_func.tooltips.str[triage_button.name] = ((tooltips[str[i][j]])? tooltips[str[i][j]][0] +
                                                                      ((tooltips[str[i][j]][1])? '\nSet style ' + ((str[i][j+2])? str[i][j+2] : 'default') + '.' : '') : '');
          }
          pn.appendChild(document.createElement('br'));
        }
//        pn.onclick = function(e){  // also works, but CSS is the better.
//          e.preventDefault();
//          var evt = document.createEvent('MouseEvents');
//          evt.initUIEvent('click', false, true, window, 1);
//          threads[pn12_triage_thread][0].dispatchEvent(evt);
//        };
        this.str = str;
        this.pn  = pn;
      },
//    make_triage: function(args){
//        var triage_str = [];
//        var pn_triage = document.createElement('div');
////        pn_triage.style.position = 'absolute';
////        pn_triage.name = 'pn_catalog_triage';
//        pn_triage.className = 'catalog_triage_parent';
//        var triage_str_lines = pref.catalog_triage_str.replace(/\/\/.*/mg,'').split('\n');
//        for (var i=triage_str_lines.length-1;i>=0;i--) if (triage_str_lines[i]==='') triage_str_lines.splice(i,1);
//        var triage_style_replace_list = (!brwsr.ff)? ['background','background-color'] : [];
//        for (var i=0;i<triage_str_lines.length;i++)
//          triage_str[i] = triage_str_lines[i].split(',');
//        for (var i=0;i<triage_str.length;i++) {
//          for (var j=0;j<triage_str[i].length;j+=3) {
//            var triage_button = document.createElement('button');
//            triage_button.innerHTML = triage_str[i][j+1];
//            triage_button.name = i+','+j;
//            triage_button.className = 'catalog_triage_button';
//            var triage_styles = (triage_str[i][j+2])? triage_str[i][j+2].split(';') : [];
//            for (var k=0;k<triage_styles.length;k++) {
//              var style_str = triage_styles[k].replace(/:.*/,'');
//              for (var m=0;m<triage_style_replace_list.length;m+=2) style_str = style_str.replace(triage_style_replace_list[m],triage_style_replace_list[m+1]);
//              triage_button.style[style_str] = triage_styles[k].replace(/[^:]*:/,'');
//            }
////            triage_button.onclick = triage_factory(i,j);
//            triage_button.onclick = args.onclick;
//            pn_triage.appendChild(triage_button);
//            if (args.wheelpatch) triage_button.onmousewheel = args.wheelpatch;
//          }
//          pn_triage.appendChild(document.createElement('br'));
//        }
////        pn_triage.onclick = function(e){  // also works, but CSS is the better.
////          e.preventDefault();
////          var evt = document.createEvent('MouseEvents');
////          evt.initUIEvent('click', false, true, window, 1);
////          threads[pn12_triage_thread][0].dispatchEvent(evt);
//////console.log('aaa');
////        };
//        return {pn:pn_triage, str:triage_str};
//    },
    modify_bookmark: function(name,add){
      var key = new RegExp('(^|,)'+name.replace(/\+/,'\\+')+'([\^@*!][^,\n]*)*(,|\n|$)','mg');
      var str = pref.catalog.filter.bookmark_list_str;
      str = str.replace(key,',') + ((add)? ','+name+'\n' : '');
      pref.catalog.filter.bookmark_list_str = str.replace(/,,+/g,',').replace(/^,/g,'').replace(/\n,/g,'\n').replace(/\n\n+/g,'\n').replace(/^\n/,'')
      if (catalog_obj.catalog_func()) {
        var tgt = catalog_obj.catalog_func().pn12_0_4.getElementsByTagName('textarea')['catalog.filter.bookmark_list_str'];
        pref_func.apply_prep(tgt,false);
      } else if (pref.catalog.auto_save_filter) { // see 'save' in catalog.
        if (localStorage) {
          key = pref.script_prefix + '.catalog.filter.' + pref.catalog_board_list_obj[pref.catalog_board_list_sel][0].key;
          var obj = JSON.parse(localStorage.getItem(key));
          obj.bookmark_list_str = pref.catalog.filter.bookmark_list_str;
          localStorage.setItem(key,JSON.stringify(obj));
        }
      }
    },
    perf_out: function(obj){
      obj.push(performance.now());
      var str = '';
      var last_ts = null;
      for (var i=0;i<obj.length;i++) {
        if (typeof(obj[i])==='number') {
          if (last_ts) str += (obj[i]-last_ts) + ', ';
          last_ts = obj[i];
        } else str += obj[i] + ', ';
      }
      console.log(str);
    },
    debug_show_proto_func_pool: null,
    debug_show_proto: function(name,obj,ex_keys,search_key) {
      if (!search_key) search_key='proto';
      if (!ex_keys) ex_keys = ['proto'];
      var str = name + ':';
      var keys = Object.keys(obj);
      for (var i=0;i<keys.length;i++) if (ex_keys.indexOf(keys[i])==-1) {
        str += keys[i] + ',';
        ex_keys.push(keys[i]);
        if (this.debug_show_proto_func_pool) this.debug_show_proto_func_pool[keys[i]] = obj[keys[i]];
      }
//      if (obj.hasOwnProperty(search_key)) str += '/' + this.debug_show_proto(obj[search_key], obj.__proto__, ex_keys, search_key); // for 'proto'
      if (obj.hasOwnProperty(search_key)) str += '/' + this.debug_show_proto(obj.__proto__[search_key], obj.__proto__, ex_keys, search_key); // for 'debug____proto'
      return str;
    },
    debug_parse_funcs_entry: function(str) {
      if (pref.debug_mode.pfunc_expand) this.debug_show_proto_func_pool = {};
      console.log(this.debug_parse_funcs(str));
      if (this.debug_show_proto_func_pool) {
        for (var i in this.debug_show_proto_func_pool) console.log(i+': '+this.debug_show_proto_func_pool[i]);
        this.debug_show_proto_func_pool = null;
      }
    },
    debug_parse_funcs: function(str) {
      for (var i in site2) for (var j in site2[i].parse_funcs) if (site2[i].hasOwnProperty('parse_funcs') && site2[i].parse_funcs.hasOwnProperty(j)) site2[i].parse_funcs[j]['debug____proto'] = i+'.'+j;
      var str2 = str.split(':');
      var start_point = site2[str2[0]].parse_funcs[str2[1]];
      return str+'::'+ ((start_point)? this.debug_show_proto('/'+start_point['debug____proto'],start_point, ['debug____proto','proto'], 'debug____proto') :
                                      'NONE');
    },
    debug_parse_funcs_all: function(str) {
      var domains = ['DEFAULT','4chan','vichan','lain','8chan','KC'];
      var types = ['','_json','_html'];
      var srcs = ['common','catalog','thread','page'];
      var objs = {};
      for (var d=0;d<domains.length;d++)
        for (var t=0;t<types.length;t++)
          for (var s=0;s<srcs.length;s++) {
            if (domains[d]!=='DEFAULT' && srcs[s]==='common') continue;
            var src_type = srcs[s]+types[t];
            if (site2[domains[d]].parse_funcs[src_type]) {
              var strs = this.debug_parse_funcs(domains[d]+':'+src_type).split(',');
              for (var i=0;i<strs.length;i++) {
                var idx_s = strs[i].lastIndexOf(':');
                if (strs[i].substr(idx_s+1)===str) {
                  strs.splice(i+1,strs.length-i-1);
                  var hier_str = strs[(i>0)?i-1:i].replace(/[^\/]*\//g,'').replace(/:[^:]*$/,'').replace(/\./,':');
                  var root_str = strs[0].replace(/::.*/,'');
                  if (hier_str!==root_str) strs[strs.length] = ' (==='+hier_str+')';
                  break;
                }
                if (idx_s===-1) strs.splice(i--,1);
                else strs[i]=strs[i].substr(0,idx_s+1);
              }
              var obj_root = site2[domains[d]].parse_funcs[src_type];
              if (obj_root) {
                var obj = obj_root[str];
                var flag = true;
//                for (var i in objs) if (objs[i]===obj) {strs[strs.length] = '(==='+i+')'; flag=false; break;}
//                if (flag) objs[domains[d]+':'+src_type] = obj;
                for (var i in objs) if (objs[i]===obj) {flag=false; break;}
                if (flag) objs[hier_str] = obj;
              }
              console.log(strs.join(''));
            }
          }
      var num = 0;
      if (pref.debug_mode.pfunc_all_expand) for (var i in objs) console.log((num++)+': '+i + ': '+objs[i]);
    },
    debug_site2func: function(name) {
      for (var i in site2) if(site2[i].hasOwnProperty(name)) site2[i]['debug____'+name] = i;
      var str = '';
      var funcs = {};
      for (var i in site2) {
        str += i+': '+site2[i]['debug____'+name]+', ';
        funcs[site2[i]['debug____'+name]] = site2[i][name];
      }
      console.log(str);
      if (pref.debug_mode.site2func_expand) for (var i in funcs) console.log(i+': '+funcs[i]);
    },
//    obj_scopy_from_key: function(obj){
//      for (var i in obj)
//        if (typeof(i)==='string' && Object.prototype.hasOwnProperty.call(obj,obj[i])) obj[i] = obj[obj[i]];
//      return obj;
//    },
    set_value_to_root: function(leaf,key,val){
      if (Object.prototype.hasOwnProperty.call(leaf,key)) leaf[key] = val;
      else this.set_value_to_root(Object.getPrototypeOf(leaf),key,val);
    },
    init_set_style: function(dom,src){
      dom.style = {};
      if (src) for (var i in src) dom.style[i] = src[i];
      if (src===null) {
        src = dom.getAttribute('style');
        if (src) {
          src = pref_func.style2obj(src);
          for (var i in src) dom.style[i] = null;
        }
      }
    },
    shallow_copy_1: function(src){
      var dst = Object.create(null);  
      for (var i in src) if (src.hasOwnProperty(i)) dst[i] = src[i];
      return dst;
    },
    image_resize : function(pn,w,h) {
      var nw = pn.naturalWidth;
      var nh = pn.naturalHeight;
      var fw = (nw>w)? nw/w : 1;
      var fh = (nh>h)? nh/h : 1;
      if (fh>1) pn.setAttribute('width', (fw>=fh)? w : nw/fh);
      if (fw>1) pn.setAttribute('height',(fh>=fw)? h : nh/fw);
//      var f  = (fw>fh)? fw : fh;
//      pn.setAttribute('width',  nw/f);
//      pn.setAttribute('height', nh/f);
    },
    toggleButton: function(pn){
      if (pn.style && pn.style.border) pn.style.border = '';
      else pn.style.border = 'inset 2px';
    },
  }

  var common_obj = {
    thread_reader: null,
    events_beforeunload: [],
  };
  common_func.dom_addEventListener(common_obj.events_beforeunload, window, 'beforeunload', function(){common_func.dom_removeEventListener(common_obj.events_beforeunload)});
  common_func.dom_addEventListener(common_obj.events_beforeunload, window, 'focus', function(){DelayBuffer.prototype.hasFocus = true;});
  common_func.dom_addEventListener(common_obj.events_beforeunload, window, 'blur', function(){DelayBuffer.prototype.hasFocus = false;});

  var site = { // krautchan/int/
    max_page   : 20,
    autosage   : 300,
    board_name : '/int/',
    url_prefix : 'https://krautchan.net/int/',
    url_prefix2 : {},
    nickname   : 'KC',
    nicknames  : ['CatChan_tgt'],
    thread_keyword: 'thread',
    postform: null,
    postform_comment: null,
    postform_submit: null,
    postform_rules: null,
    get_ops    : null,
    get_posts  : null,
////////    make_url   : null,
////////    make_url2  : function(bn,idx){
////////      var nickname  = (bn.indexOf('/')==0)? site.nickname : bn.substr(0,bn.indexOf('/'));
////////      var boardname = '/' + bn.replace(/[^\/]*\//,'').replace(/\/.*/,'/');
////////      return [nickname, boardname, idx, site2[nickname].make_url(boardname,idx)];
////////    },
    server_name : null, // optional for 2chan.
    protocol : (document.location.href.search(/https/)!=-1)? 'https:' : 'http:',
    catalog_threads_in_page : null,
//    catalog_posts_in_thread : null,
    remove_posts : function(src){return src;},
    remove_files_info : function(src){return src;},
    remove_checkboxes : function(src){return src;},
    get_thread_link : function(src){return '_blank';},
    get_time_of_last_post : function(doc){return null;},
    header_height : function(){return 0;},
    config     : function(keyword,nickname){ // url='*site/board/etc', keyword='site'
      var href = window.location.href;
      var url_site = href.substr(0,href.indexOf(keyword)+keyword.length);
      var url_board = decodeURI(href.substr(url_site.length+1));
      site.board = '/' + url_board.substr(0,url_board.indexOf('/')+1);
      site.url_prefix = url_site + site.board;
      site.server_name  = href.substr(0,href.indexOf(keyword)-1).replace(/https*:\/\/*/,'');
      site.nickname = nickname;
      site.isthread = window.location.href.search(site2[nickname].thread_keyword)!=-1;
//      for (var i in site2[nickname]) site[i] = site2[nickname][i];
//      site.features = site2[site.nickname].features;
      if (site2[nickname].features) pref_func.pref_overwrite(site.features,site2[nickname].features);
      site.myself = site2[site.nickname].get_ops(document)[0];
      site.boardlist = (site2[nickname].components.boardlist)? document.querySelector(site2[nickname].components.boardlist) : null;
      if (!site.settings && site.boardlist) site.settings = site.boardlist.appendChild(document.createElement('span'));
      if (site2[site.nickname].pref_default) pref_func.pref_overwrite(pref,site2[site.nickname].pref_default);
    },
    features : {page: true, graph: true, setting: true, setting2: true, postform: true, catalog: true, listener : true, uip_tracker: false, thread_reader: true, debug: false},
    owners_recommendation: '',
    catalog : false,
    whereami: null,
    embed_to: {},
    root_body : document.getElementsByTagName('body')[0],
//    root_body : (document.getElementsByTagName('body')[0])? document.getElementsByTagName('body')[0] :
//                                                            document.getElementsByTagName('frame')[0].contentDocument.getElementsByTagName('body')[0] // KC root
    embed_frame:'CatChan_embed_frame',
    embed_frame_win: null,
    boardlist: null,
    settings: null
  };
  site.protocol = (document.location.href.search(/https/)!=-1)? 'https:' : 'http:'; // patch for Tampermonkey.
  site.root_body2 = site.root_body;

  var site2 = {};
  site2['DEFAULT'] = { // skeleton for default
    nickname : 'DEFAULT',
    home : '', // home is used url for iframe, so it MUST BE THE SAME ORIGIN, OR LEAVE IT BLANK.
    check_func : function(){return false;}, // return true if the script is running in this site.
    boards_sel_from_tags : function(){return '';}, // return boards selection strings.
    protocol: site.protocol,
    components: {},
//    catalog_background : '#b5ccf9',
//    catalog_bordercolor : '#000000',
    horizontal_separator_in_index: function(){
//      var pn = document.createElement('div');
//      pn.innerHTML = '<br><br class="clear"><hr>';
      var pn = document.createElement('hr');
      pn.setAttribute('class', pref.script_prefix+'_hs');
      return pn;
    },
    get_time_of_posts : function(thread){return [0,0];}, // returns parsed UTC time of last and op posts from element of the thread.
    get_time_of_post_in_utc : function(post){return 0;}, // returns parsed UTC time of posts.
    get_thread_link : function(thread){return null;}, // returns href from element of the thread. THIS SHOULD BE MERGED WITH modify_thread_link.
    catalog_threads_in_page : function(doc){return [];}, // returns array of thread elements in the page from the document.
    remove_posts : function(thread,end){}, // removes posts from the thread with a certain remains.
    remove_files_info : function(thread){return thread;}, // removes file information from the thread, and returns itself.
//    remove_checkboxes : function(thread){return thread;}, // removes checkboxes from the thread, and returns itself.
    postform_rules : null,
    thread_keyword : 'thread', // thread keyword in URL.
    max_page : function(board){return 10;}, // returns max_page
    set_max_page: function(){return pref.catalog_max_page;},
//    max_page : 10, // maximum page number.
//    make_url : function(board,no,key){return ['_blank','raw'];}, // returns URL and type from board name and page number.
//    make_url3: function(board,th){return '_blank';}, // returns URL from board name and thread number.
    make_url4: function(dbt){return '_blank';}, // returns URL from dbt.
////    enumerate_boards_to_scan:function(){ // 4chan // working code.
////      var obj = [];
////      var end = (site3[site.nickname].boards.length > pref.scan.max)? pref.scan.max : site3[site.nickname].boards.length;
////      for (var i=0;i<end;i++) obj[obj.length] = '/'+site3[site.nickname].boards[i].board+'/';
////      return obj;
////    },
    enumerate_boards_to_scan:function(){
      var obj = [];
      var end = (site3[site.nickname].boards.length > pref.scan.max)? pref.scan.max : site3[site.nickname].boards.length;
      for (var i=0;i<end;i++) obj[obj.length] = site3[site.nickname].boards[i];
      return obj;
    },
    postprocess_board: function(val){ // 4chan
      site3[this.nickname].boards = [];
      for (var i=0;i<val.boards.length;i++) {
        var bd = liveTag.mems.init({domain:this.nickname, board:'/'+val.boards[i].board+'/'});
        site3[this.nickname].boards.push(bd);
//        Object.defineProperty(bd,'bump_limit',{value:val.boards.bump_limit});
      }
    },
    show_boardlist_replaced: false,
    show_boardlist: function(pn){
//      for (var i=0;i<site.boardlist.length;i++) {
//        if (site.boardlist[i].lastChild.className===pref.script_prefix+'_tag') site.boardlist[i].removeChild(site.boardlist[i].lastChild);
//        site.boardlist[i].appendChild(pn); // can't clone events.
//      }
      var sbl = site.boardlist;
      var as = sbl.getElementsByTagName('a');
      if (pref.virtualBoard.p_board==='replace') {
        for (var i=pn.childNodes.length-2;i>=0;i-=2) { // skip every delimiter
          var key = pn.childNodes[i].textContent.substr(1);
          for (var j=0;j<as.length;j++) {
            if (as[j].textContent===key) {
              if (!as[j].style) as[j].style = {};
              if (as[j].style.display!=='none') {
                as[j].style.display='none';
                as[j].parentNode.insertBefore(pn.childNodes[i],as[j]);
              } else pn.removeChild(pn.childNodes[i]); // remove '#XXX'(tag)
              pn.removeChild(pn.childNodes[i]); // remove '/'(delimiter)
            }
          }
        }
        this.boardlist_replaced = true;
      } else {
        if (this.boardlist_replaced) {
          var as = sbl.getElementsByTagName('a');
          for (var i=0;i<as.length;i++) {
            if (as[i].style && as[i].style.display==='none') {
              as[i].style.display='';
              as[i].parentNode.removeChild(as[i].previousSibling);
            }
          }
          this.boardlist_replaced = false;
        }
      }
//      if (sbl.lastChild.className===pref.script_prefix+'_tag') sbl.removeChild(sbl.lastChild);
//      if (sbl.lastChild.name===pref.script_prefix+'_tag_parent') sbl.removeChild(sbl.lastChild); // ERROR. <span> can't get name attribute.
      if (sbl.lastChild.getAttribute && sbl.lastChild.getAttribute('name')===pref.script_prefix+'_tag_parent') sbl.removeChild(sbl.lastChild);
      if (pref.virtualBoard.show) {
        pn.insertBefore(document.createTextNode('[ '),pn.firstChild);
        pn.lastChild.textContent = ' ]';
        sbl.appendChild(pn); // can't clone events.
      }
    },
    get_ops : function(doc){return [];}, // returns array of op numbers from the document.
    get_posts : function(doc) {return [];}, // returns array of posts numbers from the document.
//    absolute_link : function(doc){}, // change link from relative to absolute which includes site URL.
    absolute_link : function(doc){
      var tgts = ['src','href'];
      var all = doc.getElementsByTagName('*');
      for (var i=0;i<all.length;i++) {
        for (var j=0;j<tgts.length;j++) {
          var tgt = all[i].getAttribute(tgts[j]);
          if (tgt && tgt.indexOf('http')!=0 && tgt.indexOf('mailto:')!=0 && tgt.substr(0,2)!='//') all[i].setAttribute(tgts[j],this.protocol + '//' + this.domain_url + tgt);
        }
      }
    },
////////    insert_footer : function(thread,page_no,boardname,insert,date,nof_posts,nof_files){return [nof_posts,nof_files];}, // insert information footer, and returns count of posts and images.

////////    insert_footer2: function(thread,type,nums,nums2){}, // insert num of new replies to me, num of new replies.
//    prep_footer3 : function(){return null;}, // prepare footer
//    insert_footer3: function(thread,nums,nums2){}, // insert footer.

//    prep_own_posts: function(){}, // prepare own_post object.
//    prep_own_posts_event: function(e){}, // event entry for preparing own_post object.
    prep_own_posts_key: pref.script_prefix + '.own_posts.',
    prep_own_posts_event : function(e){
      if (e) site2[site.nickname].prep_own_posts_1(e.key); // gives 'this' value to 'prep_own_posts_1'. MUST BE site2[site.nickname].
      if (window.name===site.nickname) send_message('parent',[['OWN_POSTS', window.name, site3[window.name].own_posts]]);
    },
    prep_own_posts : function(bt){
      site3[this.nickname].own_posts = {};
      if (localStorage) {
        var keys = (bt)? [this.prep_own_posts_key + bt] : Object.keys(localStorage);
        for (var i=0;i<keys.length;i++) this.prep_own_posts_1(keys[i]);
      }
//console.log(site3[this.nickname].own_posts);
    },
    prep_own_posts_1 : function(key){
      if (key.indexOf(this.prep_own_posts_key)==0) {
        var bt = key.substr(this.prep_own_posts_key.length);
        var board = bt.substr(0,bt.lastIndexOf('/')+1);
        if (!site3[this.nickname].own_posts[board]) site3[this.nickname].own_posts[board] = {};
        var nos = JSON.parse(localStorage[key] || '[]');
        for (var j=0;j<nos.length;j++) site3[this.nickname].own_posts[board][nos[j]] = null;
      }
    },
    clean_up_own_posts : function(ths,board){
//console.log('clean up');
      if (localStorage) {
        var nos = {};
        for (var i=0;i<ths.length;i++) nos[ths[i].key.substr(ths[i].key.lastIndexOf('/')+1)] = null;
        var own_key_bd = this.prep_own_posts_key + board;
        var keys = Object.keys(localStorage);
        for (var i=0;i<keys.length;i++)
          if (keys[i].indexOf(own_key_bd)==0 && nos[keys[i].substr(own_key_bd.length)]!==null) delete localStorage[keys[i]]
      }
//console.log(site3[this.nickname].own_posts);
    },


//    check_reply_to_me: function(name,dbt,nums,value,date,pool, type){
//      this.check_reply.do(value,dbt,nums,date,type);
////      nums[2] = date[2]-nums[7]; // patch
//console.log(name+': '+ new Date(nums[0]).toLocaleString()+', '+nums[2]+', '+ new Date(nums[3]).toLocaleString()+', '+nums[7]);
//    }, // check new posts.
    check_reply: (function(){
      var com_or_txt = false;
      var pn_tags = document.createElement('div');
      var regexp_anchor      = '';
      var regexp_anchor_len  = 0;
      var regexp_anchor_cb   = '';
      var regexp_anchor_txt    = />>[0-9]+/g;
      var regexp_anchor_cb_txt = />>>\/[0-9A-z_\+]+\/[0-9]+/g;
      var regexp_anchor_com    = /&gt;&gt;[0-9]+/g;
      var regexp_anchor_cb_com = /&gt;&gt;&gt;\/[0-9A-z_\+]+\/[0-9]+/g;
      var remake_own_posts = true;
      var own_posts;
      var own_posts_cb;
      var tag_ex_list;
      var str_rm_list;
      var count_replies = 0; // for direct call to check_t1 from native catalog.
      function add_you(post){
        var as = post.pn.getElementsByTagName('a');
        for (var i=0;i<as.length;i++) {
          var to_me = false;
          var txt = as[i].textContent;
          if (regexp_anchor_txt.test(txt) && own_posts && own_posts[txt.substr(2)]===null) to_me = true; // SHOULD USE SEARCH INSTEAD OF TEST TO KEEP CONSISTENCY.
          if (!to_me && regexp_anchor_cb_txt.test(txt)) {
            var tgt = txt.split('/');
            var bd = '/'+tgt[1]+'/';
            if (own_posts_cb[bd] && own_posts_cb[bd][tgt[2]]===null) to_me = true;
          }
          if (to_me) {
            if (pref.thread_reader.show_reply_to_me_by==='plain') as[i].parentNode.insertBefore(document.createTextNode(' (You)'), as[i].nextSibling);
            else as[i].textContent = as[i].textContent + ' (You)'; // break dollchan.
          }
        }
      }
      function check_1(post, watch){
        if (!pref.catalog_footer_ignore_my_own_posts || !own_posts || !(post.post_no in own_posts)) {
          var com = post.com;
          if (com) {
            var to_me  = false;
            if (own_posts) {
              var anchors = com.match(regexp_anchor);
              if (anchors!==null) {
                for (var j=0;j<anchors.length;j++) {
                  var tgt = anchors[j].substr(regexp_anchor_len);
                  if (own_posts[tgt]===null) {to_me = true; break;}
            }}}
            if (!to_me && own_posts_cb) {
              anchors = com.match(regexp_anchor_cb);
              if (anchors!==null) {
                for (var j=0;j<anchors.length;j++) {
                  var tgt = anchors[j].split('/');
                  var bd = '/'+tgt[1]+'/';
                  if (own_posts_cb[bd] && own_posts_cb[bd][tgt[2]]===null) {to_me = true; break;}
            }}}
            if (to_me) {
              post.reply_to_me = true;
              watch[1]++;
            }
          }
          watch[4][watch[4].length] = post;
          watch[2]++;
        }
        check_t1(post, watch);
      }
      function check_t1(post, watch){
//        var mail = post.mail; // 4chan doesn't have this.
        var mail = post.com;
        if (mail) {
          if (com_or_txt) { // BUG. IF COM HAS THE TAG <WBR>, SOMETIME CAUSE INCONSISTENCY.
            pn_tags.innerHTML = mail;
            mail = pn_tags[brwsr.innerText];
          }
          if (str_rm_list) for (var i=0;i<str_rm_list.length;i++) mail = mail.replace(str_rm_list[i],'\n');
          var tags = mail.match(liveTag.scan_regex);
//          if (tags!==null) watch[9] = watch[9].concat(tags);
          if (tags!==null)
            for (var i=0;i<tags.length;i++)
              if (tags[i].length<=pref.liveTag.maxstr) {
                if (tag_ex_list) {
                  var flag = false;
                  for (var j=0;j<tag_ex_list.length;j++) if (tag_ex_list[j].test(tags[i])) {flag=true;break;}
                  if (flag) continue;
                }
                watch[9][watch[9].length] = tags[i];
              }
        }
        count_replies++;
      }
      function prep_check_1(th){
        if (th.type_data==='html') {
          regexp_anchor     = regexp_anchor_txt;
          regexp_anchor_len = 2;
          regexp_anchor_cb  = regexp_anchor_cb_txt;
          com_or_txt        = false;
        } else {
          regexp_anchor     = regexp_anchor_com;
          regexp_anchor_len = 8;
          regexp_anchor_cb  = regexp_anchor_cb_com;
          com_or_txt        = true;
        }
      }
      function prep_check_t1(th){
        if (pref.liveTag.ex_list) {
          tag_ex_list = pref_func.merge_obj5(th.key,pref.liveTag.ex_list_obj5,null);
          str_rm_list = pref_func.merge_obj5(th.key,pref.liveTag.rm_list_obj5,null);
        } else {
          tag_ex_list = null;
          str_rm_list = null;
        }
//        tag_ex_list = (pref.liveTag.ex_list)? pref_func.merge_obj5(th.key,pref.liveTag.ex_list_obj5,null) : null;
      }
      return {
        remake_own_posts : function(){remake_own_posts = true;}, // couldn't get an event from myself, so don't miss posts from my thread.
        make_own_posts : function(){  // called also from catalog initialializer, prevent from being called twice at initial.
          site2[site.nickname].prep_own_posts();
          remake_own_posts = false;
        },
        add_you: add_you,
//        check_t1: check_t1,
        check_t1: function(th,watch){
          prep_check_t1(th);
          check_t1(th,watch);
        },
//        check: function(th, watch, make_pn){
        check: function(th, watch){
          var init = (watch[3]<0); // patch for retag.
          if (watch[3]<0) watch[3] = -watch[3];
          var time_check = watch[3];
          var watchtime_changed = false;
//          var time_lastsaw = (watch[3]>0)? watch[3] : watch[0];
//          var time_lastsaw = (watch[3]>watch[0])? watch[3] : watch[0]; // redundant anymore.
          if (watch[0]<0) { // initial
            watch[0] = -watch[0];
            time_check = watch[0];
            watch[1] = 0; // number of unread replies to me
            watch[2] = 0; // number of unread replies
//            watch[10]= 0; // number of replies so far
            watch[10]= (th.omitted_posts)? th.omitted_posts+1 : 0; // number of replies so far, patch for 4chan catalog_json.
            init     = true;
            watchtime_changed = true;
          }
          common_func.set_value_to_root(watch,'4',[]);
//          watch[4] = [];
          count_replies = 0;

          prep_check_1(th);
//console.log('start: '+dbt[0]+dbt[1]+dbt[2],watch[5]);
          var i = th.posts.length-1;
          if (remake_own_posts) this.make_own_posts();
//          if (remake_own_posts) { // working code.
//            site2[site.nickname].prep_own_posts(); // couldn't get an event from myself, so don't miss posts from my thread.
//            remake_own_posts = false;
//          }
          if (i>=0) {
            common_func.set_value_to_root(watch,'9',[]); // patch
//            watch[9] = [];
            var ur_old = (watch[1]>0)? 3 : (watch[2]>0)? 1 : 0;
            watch[3] = th.posts[i].time;
            if (th.parse_funcs.time_unit!=1) time_check /= th.parse_funcs.time_unit;
            if (watch[3]!=time_check) liveTag.mems[th.domain][th.board].nr_dirty = true;
            own_posts_cb = site3[th.domain].own_posts;
            own_posts = own_posts_cb[th.board];
            prep_check_t1(th);
            if (Object.keys(own_posts_cb).length==0) own_posts_cb = undefined; // patch for faster execution.
//            while (i>=0 && th.posts[i].time>time_lastsaw) check_1(th.posts[i--], watch, !watch[5]); // for one time parse // redundant anymore.
            if (watch[0]>0) {while (i>=0 && th.posts[i].time>time_check) check_1(th.posts[i--], watch);}
            if ((pref.liveTag.use && pref.liveTag.from==='post') || common_obj.thread_reader)
              while (i>=0 && (init || th.posts[i].time>time_check)) check_t1(th.posts[i--], watch); // tuned for initial loop.
            if (pref.liveTag.use && !common_obj.thread_reader) {
              if (watch[9].length!=0) var tags = liveTag.extract_tags(th);
              else if (pref.liveTag.style && watch[0]!==0) {
                var ur = (watch[1]>0)? 3 : (watch[2]>0)? 1 : 0;
                if (ur_old!=ur) liveTag.update_ur(th.key,ur,ur_old!=0 && watchtime_changed); // can choose faster function if ur==0.
              }
            }
//            watch[9] = null;

////          while (i>=0 && th.posts[i].time>time_check) { // working code.
/////            check_1(th.posts[i], watch, make_pn, !watch[5] && th.posts[i].time>time_lastsaw, th);
////            check_1(th.posts[i], watch, !watch[5] && th.posts[i].time>time_lastsaw, th);
////            i--;
////          }

////          var first = true;
////          while (th.parse_funcs['pop_post'](th)) { // working code.
////            if (first) {
////              if (remake_own_posts) {
////                site2[site.nickname].prep_own_posts(); // couldn't get an event from myself, so don't miss posts from my thread.
////                remake_own_posts = false;
////              }
////              watch[3] = th.post.time;
////              first = false;
////            }
////            if (th.post.time>time_check)
////              check_1(th.post, watch, dbt, make_pn, !watch[5] && th.post.time>time_lastsaw);
////            else break;
////          }
//          watch[5] = false;
            watch[3] *= th.parse_funcs.time_unit;
          }
//          watch[6] = watch[0];
          common_func.set_value_to_root(watch,'7',count_replies); // patch
          watch[10]+= count_replies;
//console.log('end:   '+dbt[0]+dbt[1]+dbt[2]);
//if (pref.debug_mode['3'] && watch[9].length!=0) console.log(th.key+': '+watch[9]);
////////          if (cataLog.threads && cataLog.threads[th.key]) { // working code.
//////////            if (!cataLog.threads[th.key][9][0]) cataLog.threads[th.key][9] = cataLog.catalog_filter_query(th.key); // doesn't work because threads[name][8] is NOT updated.
////////            cataLog.insert_footer3(th.key,null,th.page,tags);
////////          }
          return (tags)? true : false;
        },
////        do: function(doc_obj,dbt,watch,date,type){
////////          var parse_obj = {domain:dbt[0], board:dbt[1], parse_funcs:site2[dbt[0]].parse_funcs[type], __proto__:site4.parse_funcs_on_demand};
////////          var th;
////////          if (type==='thread_html') {
////////            var root = {pn:doc_obj, __proto__:parse_obj};
////////            th = root.ths[0];
////////          } else {
////////            doc_obj.__proto__ = parse_obj;
////////            th = doc_obj;
////////          }
//////////          th.parse_funcs['pop_post_prep'](th);
////          var th = site2[site.nickname].wrap_to_parse.get(doc_obj, dbt[0], dbt[1], type, {thread:dbt[2]})[0];
////          site2[th.domain].check_reply.check(th, watch, false);
////          date[4] = watch[3];
////        }
      }
    })(),

////////    get_posts2 : function(doc,pool){return {}}, // subfunction of check_reply_to_me, parse html to json.
    get_post_offsetTop : function(doc,num) {}, // get offsetTop of Nth object.
    favicon: {}, // object for favicon
//    get_op_image_url: function(th,type){}, // get op image's url.
    add_sticky_info : function(){}, // add sticky icon.
//    embed_to: {
//      'page'  : {'top' : null, 'bottom' : null},
//      'thread': {'top' : null, 'bottom' : null}
//    },
    time_revised_check: function(nof_ths){return false;},

    format_thread_layout   : function(thread){}, // formats its layout   for catalog.
    format_thread_style    : function(thread){}, // formats its style    for catalog.
    format_thread_contents : function(thread){}, // formats its contents for catalog.
    format_thread_always   : function(thread){}, // formats its contents for catalog, always executed.
    format_time            : function(thread){}, // formats its timestamp to local time.
    format_remove_tn_area_size: function(thread){}, // remove thumbnail area size
//    mark_newer_posts       : function(thread,time){return null;},  // mark newer posts, and returns marked first post.
//    unmark_post_from_event : function(post){},  // unmark post.
    mark_newer_posts : function(nickname,posts,date,style_mark,style_unmark,class_or_tag,key,unmark){
//      var offset_top = 0;
      var marked_first_post = null;
      for (var i=posts.length-1;i>=0;i--) {
        var mark = date<site2[nickname].get_time_of_post_in_utc(posts[i]);
        var reply = posts[i];
//        posts[i] = posts[i].parentNode;
//        if (class_or_tag=='class') while (posts[i].className.search(key)==-1) posts[i] = posts[i].parentNode;
//        if (class_or_tag=='tag') while (posts[i].tagName.search(key)==-1) posts[i] = posts[i].parentNode;
        if (class_or_tag=='class') reply = posts[i].getElementsByClassName(key)[0];
        if (class_or_tag=='tag')  reply = posts[i].getElementsByTagName(key)[0];
        if (reply)
          if (mark) {
            reply.setAttribute('style',style_mark);
            if (unmark) reply.addEventListener('mouseover', site2[nickname].unmark_post_from_event, false);
//            offset_top = reply.offsetTop;
            marked_first_post = reply;
          } else reply.setAttribute('style',style_unmark);
      }
//      return offset_top;
      return marked_first_post;
    },
    unmark_post_from_event: function() {
      this.setAttribute('style','border: none');
      this.removeEventListener('mouseover', site2['common'].unmark_post_from_event, false);
    },
    modify_thread_link     : function(thread){return [];}, // modify thread link and returns information to add event listener.
    preprocess_html        : function(doc_txt){return doc_txt;},  // pre-process document from txt. // cause memory leak.
    preprocess_doc         : function(doc){},  // pre-process document.
////////    thread2headline : function(doc){return [0,0];},  // make headline from entire thread, returns num of [posts, images].
//    add_thread_link : function(doc,url){}, // add link to this thread.
    check_thread_archived : function(thread){return false;}, // check the thread is archived.
    get_owners_recommendation: function(){return '';}, // return string of owner's recommendation.
    get_board_tags : function(){return {};}, // return object of board tags.
//    get_json_url_thread : function(board,thread){return '';}, // return url of JSON API.
    get_json_url_catalog : function(board){return '';}, // return url of JSON API.
//    parse_json_thread: function(txt,from_http){return JSON.parse(txt);}, // parser of JSON API.
    parse_json_thread: function(obj,from_http){}, // parser of JSON API.
    parse_json_catalog: function(txt){return JSON.parse(txt);},  // parser of JSON API.
    uip_tgt_post : function(no){return null;}, // returns uip target post.
    uip_post_num : function(post){return null;}, // returns num in posts.
    uip_check: function(callback){}, // hook for uip_tracker.
    catalog_native_prep: function(depend_on_site){return []}, // prepare for native catalog.
    catalog_frame_prep: function(pn12){}, // prepare for frame mode.
    catalog_native_frame_prep: function(pn12,pn12_button){ // prepare for frame mode in native catalog.
      var mode = false;
      var ifrm;
      var pn_catalog;
      function insert_remove_frame(){
        if (!mode) {
          pn_catalog = site2['common'].absorb_children(site.root_body);
          pn_catalog.style.width = pref.catalog_size_frame0_width + '%';
          pn_catalog.style.float = 'left';
          pn_catalog.style.height = '' + window.innerHeight + 'px';
          pn_catalog.style.overflow = 'scroll';
          ifrm = site2[site.nickname].catalog_native_frame_prep_frame(site.root_body,null);
        } else {
          site.root_body.removeChild(ifrm);
          ifrm = null;
          site.embed_frame_win = null;
          site2['common'].disgorge_children(pn_catalog);
//          this.removeEventListener('click', insert_remove_frame, false);
        }
        mode = !mode;
      }
      pn12_button.addEventListener('click', insert_remove_frame, false);
    },
    catalog_native_frame_prep_frame: function(parent,ref_node){
      ifrm = document.createElement('iframe');
      ifrm.setAttribute('name',site.embed_frame);
      ifrm.style.height = '' + window.innerHeight + 'px';
      ifrm.style.margin = '0px';
      ifrm.style.width = pref.catalog_size_frame1_width + '%';
      parent.insertBefore(ifrm,ref_node);
      site.embed_frame_win = ifrm.contentWindow;
      return ifrm;
    },
    catalog_embed_prep: function(pn12){
      pn12.style.position = '';
      pn12.childNodes[1].style.width = '';
      pn12.childNodes[1].style.height = '' + window.innerHeight + 'px';
      pn12.childNodes[0].childNodes[0].style.display = 'none';
      pn12.childNodes[0].childNodes[1].style.display = 'none';
      pn12.style.border = '';
      pn12.style.left = '';
      pn12.style.resize = '';
      pn12.style.top = '';
    },
    postform_activation : null,
    url_boards_json: function(){return '';}, // returns url of boards.json.
    thread2search_obj : function(thread){return [thread[brwsr.innerText],'','','','','','',''];}, // return search_obj from thread.
////    get_click_area: function(pn){
////      var img = pn.getElementsByTagName('img');
////      return (img.length!=0)? img : pn;
////    },
//    get_click_area: function(pn){
//      var img0 = pn.getElementsByTagName('img')[0];
//      return (img0)? img0 : pn;
//    }
    popups_op_func_set: function(){return 1;}, // vichan
    popups_op_func_use: function(pn,thq,no){ // vichan
      pn.setAttribute('class',pn.getAttribute('class')+' reply');
      pn.insertBefore(thq[no].pn.parentNode.querySelector('.files').cloneNode(true),pn.firstChild);
    },
    popup_info:null,
    popups_post_entry: function(e){
      var th_q = site2[site.nickname].popups_href2th_q(this.getAttribute('href')); // TEMPORAL
      var dbt = th_q[2];
      if (!th_q) return;
      if (Array.isArray(th_q[0][th_q[1]])) {
        cataLog.scan_init('popup',[site.nickname+dbt[1]+((pref.catalog.catalog_json)? 't':'')+dbt[2]], {});        //TEMPORAL
        site2[site.nickname].popup_info = {node:this, clientX:e.clientX, clientY:e.clientY, key:dbt[0]+dbt[1]+dbt[2]+'#'+dbt[3]}; // TEMPORAL
        this.onmouseout = function(){
          this.onmouseout=null;
          site2[site.nickname].popup_info=null;                                                                    // TEMPORAL
        };
      } else {
        var pn = (th_q[0][th_q[1]].pn && th_q[0][th_q[1]].pn.cloneNode(true)) || site2[site.nickname].post_json2html(th_q[0][th_q[1]], dbt[1]); // TEMPORAL
        pn.style = {};
        pn.style.position = 'fixed';
        pn.style.left = e.clientX + 20 + 'px';
        if (!pref.test_mode['25']) pn.style.top  = e.clientY + 20 + 'px';
        else pn.style.bottom  = window.innerHeight - e.clientY + 20 + 'px';
        pn.style.zIndex = 1;
        pn.style.borderStyle = 'solid';
        pn.style.boxShadow = 'rgb(153, 153, 153) 1px 1px 1px';
        if (th_q[0][th_q[1]].isOP) site2[site.nickname].popups_op_func_use(pn,th_q[0], th_q[1]);             // TEMPORAL
        site2[site.nickname].format_pn(pn, th_q[0][th_q[1]]);                                               // TEMPORAL
        var pnode = this;
        while ((pnode.getAttribute('class') || '').indexOf('post')==-1 && pnode.parentNode) pnode = pnode.parentNode;
        pnode.appendChild(pn);
        this.onmouseout = function(){this.onmouseout=null;pnode.removeChild(pn);};
        site2[site.nickname].popup_info = null;
        if (pref.debug_mode['10']) site2[site.nickname].popups_debug('popup: '+th_q[1]+': ',th_q[0]);
      }
    },
//    popups_post: function(sender,e){
//      this.post_json2html(sender
//    },

    popups_href2dbtp: function(href, src, th){
      if (href[0]==='#') {
        href = th.board+'res/'+th.no+'.html'+href;
        src.setAttribute('href',href);
      }
      var hrefs = href.split('/');
      var p = hrefs[hrefs.length-1].substr(hrefs[hrefs.length-1].indexOf('#')+1);
      var t = hrefs[hrefs.length-1].substr(0,hrefs[hrefs.length-1].indexOf('.'));
      var b = '/'+hrefs[hrefs.length-3]+'/';
      var d = site.nickname;                                                                          // TEMPORAL
      return [d,b,t,p];
    },
    popups_href2th_q: function(href,src,th){
      var dbt = this.popups_href2dbtp(href,src,th);
//      var th = liveTag.mems[d][b][t];
      var th = liveTag.mems.init({domain:dbt[0], board:dbt[1], no:dbt[2]});
      if (th.q===undefined) th.q = {};
      if (!liveTag.mems[dbt[0]][dbt[1]][dbt[2]] || !liveTag.mems[dbt[0]][dbt[1]][dbt[2]].q) return null; // patch for accessibility check. 'if (!th)' doesn't work.
      return [liveTag.mems[dbt[0]][dbt[1]][dbt[2]].q, dbt[3], dbt];
    },
////    popups_add: function(posts, posts_old, th){ // working code.
////      if (!posts_old) posts_old = [];
////      var th_q0 = liveTag.mems[th.domain][th.board][th.no];
////      if (th_q0.q===undefined) th_q0.q = {};
////      var thq = th_q0.q;
////      if (posts) for (var i=0;i<posts.length;i++) Object.defineProperty(posts[i],'no',{value:th.parse_funcs.no(posts[i])});
////      if (posts && posts.length!=0) {
//////        for (var i=0;i<posts.length;i++) Object.defineProperty(posts[i],'no',{value:parseInt(posts[i].pn.getElementsByClassName('post_no')[1].textContent,10)});
//////        if (posts_old.length!=0) while (posts_old[0].no<posts[0].no) this.popups_release(posts_old.shift()); // [0] is OP
////        if (posts.length>1) while (posts_old.length>1 && posts_old[1].no<posts[1].no) this.popups_release(posts_old.splice(1,1)[0]);
////      }
////      if (posts) {
////        for (i=0;i<posts.length;i++) {
////          var flag_old = posts_old.length!=0 && posts_old[posts_old.length-1].no>posts[i].no;
////          var tgts = [];
////          var as = posts[i].pn.getElementsByTagName('a');
////          for (var j=0;j<as.length;j++)
////            if (as[j].textContent.search(/>>[0-9]+$/)!=-1) {
////              as[j].onmouseover = this.popups_post_entry;
////              if (!flag_old) {
////                var th_q = site2[th.domain].popups_href2th_q(as[j].getAttribute('href'),as[j],th);
////                if (th_q) {
////                  tgts[tgts.length] = as[j].getAttribute('href');
////                  this.popups_grep(th_q[0],th_q[1]);
////                }
////              }
////            }
////          if (!flag_old) {
////            posts_old[posts_old.length] = (tgts.length!==0)? {no:posts[i].no, tgts:tgts, thq:thq} : {no:posts[i].no, thq:thq};
////            this.popups_grep(thq,posts[i].no);
////            this.popups_set(thq,posts[i].no,posts[i]);
////            if (i===0) thq[posts[i].no].isOP = 1;
////          }
////        }
////      } else while (posts_old.length>1) this.popups_release(posts_old.shift());
////      if (pref.debug_mode['10']) {
////        var d_str = '';
////        for (var i in thq) d_str += i+':'+((thq[i].reffered)? thq[i].reffered : thq[i])+', ';
////        console.log('popups_add :'+th.key+': '+d_str);
////      }
////      return posts_old;
////    },
////    popups_grep: function(thq, no){
////      if (thq[no]===undefined) thq[no] = 1; // waiting to be filled, but not make requests.
////      else if (typeof(thq[no])==='number') thq[no] = thq[no] + ((thq[no]<0)? -1 : 1);
////      else ++thq[no].reffered;
////    },
////    popups_set: function(thq, no, val){
////      if (typeof(thq[no])==='number') {
////        thq[no] = val;
////        thq[no].reffered = (val_old>=0)? val_old : -val_old;
////      }
////    },
////    popups_release_1: function(th_q){
////      if (th_q) {
////        if (typeof(th_q[0][th_q[1]])==='number') {
////          th_q[0][th_q[1]] -= (th_q[0][th_q[1]]<0)? -1 : 1;
////          if (th_q[0][th_q[1]]===0) delete th_q[0][th_q[1]];
////        } else if (--th_q[0][th_q[1]].reffered===0) delete th_q[0][th_q[1]];
////      }
////    },
////    popups_release: function(post){
////      if (post.tgts)
////        for (var i=0;i<post.tgts.length;i++)
////          this.popups_release_1(site2[site.nickname].popups_href2th_q(post.tgts[i])); // TEMPORAL
////      this.popups_release_1([post.thq, post.no]);
////      if (pref.debug_mode['10']) {
////        var d_str = '';
////        for (var i in thq) d_str += i+':'+((thq[i].reffered)? thq[i].reffered : thq[i])+', ';
////        console.log('popups_release :'+post.no+': '+d_str);
////       }
////    },
    popups_add: function(tgt_th16, th, activate){
      var posts = tgt_th16.posts;
      if (!tgt_th16.popups) tgt_th16.popups = Object.create(null);
      var popups = tgt_th16.popups;
      var th_q0 = liveTag.mems[th.domain][th.board][th.no];
      if (th_q0.q===undefined) th_q0.q = {};
      var thq = th_q0.q;
      if (posts) if (th.type_data==='html') for (var i=0;i<posts.length;i++) Object.defineProperty(posts[i],'no',{value:th.parse_funcs.no(posts[i])});
                 else for (var i=0;i<posts.length;i++) if (!posts[i].pn) posts[i].pn = this.post_json2html(posts[i],th.board);
      var posts_exist = {};
      if (posts) {
        var link_regex = />>[0-9]+$|>>>\/[0-z_]+\/[0-9]+$/;
        for (i=0;i<posts.length;i++) {
          var post_no = posts[i].no;
          posts_exist[post_no] = null;
          if (popups[post_no]===undefined) {
            var quotes = [];
            var as = posts[i].pn.getElementsByTagName('a');
            for (var j=0;j<as.length;j++)
//              if (as[j].textContent.search(/>>[0-9]+$/)!=-1) {
              if (as[j].textContent.search(link_regex)!=-1) {
                if (activate) as[j].onmouseover = this.popups_post_entry;
                var th_q = site2[th.domain].popups_href2th_q(as[j].getAttribute('href'),as[j],th);
                var a_class = as[j].parentNode.getAttribute('class');
                if (a_class && a_class.indexOf(this.backlink_class)==-1) { // skip backlinks
                  if (th_q) {
                    quotes[quotes.length] = [th_q[0], th_q[1]];
                    this.popups_add_backlink(th_q[0],th_q[1],th.key+'#'+post_no);
                  }
                }
              }
            this.popups_set(thq,post_no,posts[i],quotes);
            if (i===0) thq[post_no].isOP = site2[th.domain].popups_op_func_set(posts[i].pn);
            popups[post_no] = thq;
          }
        }
      }
      for (var i in popups) {
        if (posts_exist[i]===undefined) {
          this.popups_release(popups[i], i, th.key);
          delete popups[i];
        }
      }
      if (posts) this.format_pn(posts[0].pn, thq[th.no]);
//      if (pref.debug_mode['10']) this.popups_debug('popups_add: '+th.no+': ', thq);
    },
    popups_add_backlink: function(thq, no, key){
      if (thq[no]===undefined) thq[no] = [key];
      else if (Array.isArray(thq[no])) thq[no][thq[no].length] = key;
      else {
        if (!thq[no].backlinks) thq[no].backlinks = [];
        thq[no].backlinks[thq[no].backlinks.length] = key;
        if (thq[no].pn) this.add_backlinks(thq[no].pn,thq[no].backlinks,thq[no].backlinks.length-1);
      }
    },
    popups_remove_backlink: function(thq, no, key){
      var ary = (Array.isArray(thq[no]))? thq[no] : thq[no].backlinks;
      var idx = ary.indexOf(key);
      if (idx>=0) ary.splice(idx,1);
      else console.log('ERROR in handling popups ' + no+', '+key+', '+thq[no].backlinks);
      if (ary.length===0 && thq[no].remove_if_no_backlinks) delete thq[no];
      if (pref.debug_mode['10']) this.popups_debug('popups_remove_backlinks: '+no+': '+key+': ', thq);
    },
    popups_set: function(thq, no, val, quotes){
      if (thq[no]===undefined) thq[no] = val;
      else if (Array.isArray(thq[no])) {
        val.backlinks = thq[no];
        thq[no] = val;
      }
      if (quotes) thq[no].quotes = quotes;
    },
    popups_release: function(thq, no, th_key){
      var thq_no = thq[no];
      if (thq_no.quotes)
        for (var i=0;i<thq_no.quotes.length;i++)
          this.popups_remove_backlink(thq_no.quotes[i][0], thq_no.quotes[i][1], th_key+'#'+no);
      if (!thq_no.backlinks || thq_no.backlinks.length===0) delete thq[no];
      else thq_no.remove_if_no_backlinks = 1;
      if (pref.debug_mode['10']) this.popups_debug('popups_release: '+no+': ', thq);
    },
    popups_fetched: function(th){
      if (th.tags.q && th.posts) {
        for (var i in th.tags.q) {
          if (Array.isArray(th.tags.q[i])) {
            var k = parseInt(i,10);
            var j=th.posts.length-1;
            while (j>0 && k<th.posts[j].no) j--;
            if (k===th.posts[j].no) {
              this.popups_set(th.tags.q, i, th.posts[j]);
              if (this.popup_info && this.popup_info.key===th.key+'#'+th.posts[j].no) this.popups_post_entry.call(this.popup_info.node,this.popup_info);
            } else if (th.type_source==='thread') th.tags.q[i] = {time: 0, com:'DELETED'};
          }
        }
      }
    },
    popups_debug: function(kwd, thq){
      var d_str = '';
      for (var i in thq) d_str += i+':'+((Array.isArray(thq[i]))? thq[i] : (thq[i].backlinks || thq[i].remove_if_no_backlinks))+', ';
      console.log(kwd+d_str);
    },

    wrap_to_parse: (function(){
      var th_regexp = /[A-z]/;
      var parse_objs = {};
      return {
        get: function(doc_obj, domain, board, type, options){
          var proto = site4.parse_funcs_on_demand;
//if (pref.test_mode['6']) proto = site4.parse_funcs_no_cache; // no cache parse to reduce memory consumption.
//if (pref.test_mode['6']) proto = site4.parse_funcs_one_time; // one time parse for faster execution.
if (pref.debug_mode.parse_error) proto = site4.parse_funcs_on_demand_debug;
//          var key = domain+board+type +'/'+pref.test_mode['6']+pref.debug_mode.parse_error;
//          var key = domain+board+type;
//          var parse_obj = parse_objs[key];
          var key = type + ((pref.debug_mode.parse_error)? '_debug':'');
          var pfunc_root = liveTag.mems.init({domain: domain}).pfunc;
          if (!pfunc_root[key]) {
            pfunc_root[key] = {domain: domain,
                         parse_funcs: site2[domain].parse_funcs[type],
                         parse_funcs_html: site2[domain].parse_funcs[type],
                         type_parse: type,
                         type_source: type.substr(0,type.indexOf('_')),
                         type_data: type.substr(type.indexOf('_')+1),
                         type_html: type.replace(/_json/,'_html'),
                         type_html_domain: domain,
//                         thread: null, // for faster execution.
//                         page_no: null,
//                         __proto__:site4.parse_funcs_on_demand
                         __proto__:proto
                        };
          }
          var parse_obj = {board: board, __proto__:pfunc_root[key]};
          if (options) {
            if (options.thread!==undefined && th_regexp.test(options.thread)) options.thread = options.thread.substr(1);
            options.__proto__ = parse_obj;
            parse_obj = options;
          }
//          if (options) {  // working code.
//            if (options.thread) parse_obj.thread = (th_regexp.test(options.thread))? options.thread.substr(1): options.thread;
//            if (options.page) parse_obj.page = options.page;
//          }
          if (type.indexOf('_json')==-1) {
            var retval = {pn:doc_obj, __proto__:parse_obj};
            return (type==='thread_html')? retval.ths : // thread_html
                                           retval.ths;  // page_html, catalog_html
          } else {
//            if (site2[domain].parse_funcs[type].preprocess) site2[domain].parse_funcs[type].preprocess(doc_obj);
            return (type==='thread_json')? [{obj:doc_obj, posts: doc_obj.posts, ext: doc_obj.posts[0].ext, tim:doc_obj.posts[0].tim,
                                             key: parse_obj.domain + parse_obj.board + parse_obj.thread, no: parse_obj.thread, __proto__:parse_obj}] : // thread_json
                                            {obj:doc_obj, __proto__:parse_obj}.ths;
//            if (type==='thread_json') { // DOESN'T WORK, copied time_bumped and this cause problem. 
//              var retval = {obj:doc_obj, key: parse_obj.domain + parse_obj.board + parse_obj.thread, no: parse_obj.thread, __proto__:parse_obj};
//              for (var i in doc_obj.posts[0]) Object.defineProperty(retval,i,{value:doc_obj.posts[0][i], writable:true, configurable:true, enumerable:true});
//              return [retval];
//            } else return {obj:doc_obj, __proto__:parse_obj}.ths;
          }
        },
////        clean: function(boards){
////          var keys = Object.keys(parse_objs);
////          for (var i=0;i<keys.length;i++) {
////            var key_split = keys[i].split('/');
////            if (boards[key_split[0]+key_split[1]]===undefined) parse_objs[keys[i]] = null;
////          }
////        }
      }
    })(),
    parse_pn_dummy: document.createElement('div'),
    parse_funcs: { // DEFAULT
      'common': {
        entry : function(dtpo,req) { // doc, thread, post, object
          for (var i=0;i<req.length;i++) {
            if (req[i]===':ITER') {
              if (req[i+1]===':ALL') for (var j=0;j<dtpo[req[i+2]].length;j++) this.exe_sub(dtpo,req,i,j);
              else if (req[i+1]===':FL') {
                this.exe_sub(dtpo,req,i,0);
                this.exe_sub(dtpo,req,i,dtpo[req[i+2]].length-1);
              } else if (req[i+1]===':FLx' || req[i+1]===':GFLx' || req[i+1]===':GALL') {
                var j = dtpo[req[i+2]].length - pref.catalog_t2h_num_of_posts;
                if (j<1 || req[i+1]===':GALL') j=1;
                if (req[i+1]===':FLx') {
                  this.exe_sub(dtpo,req,i,0);
                  while (j<dtpo[req[i+2]].length) this.exe_sub(dtpo,req,i,j++);
                } else {
  //                dtpo[req[i+3][0]] = [];
                  Object.defineProperty(dtpo,req[i+3][0], {value:[], enumerable:true, configurable:true, writable:true});
                  dtpo[req[i+3][0]].push(dtpo[req[i+2]][0][req[i+3][1]]);
                  while (j<dtpo[req[i+2]].length) dtpo[req[i+3][0]].push(dtpo[req[i+2]][j++][req[i+3][1]]);
                  for (var j=dtpo[req[i+3][0]].length-1;j>=0;j--) if (!dtpo[req[i+3][0]][j]) dtpo[req[i+3][0]].splice(j,1);
                }
              }
              i += 3;
  //          } else dtpo[req[i]] = this[req[i]](dtpo,req);
            } else Object.defineProperty(dtpo,req[i], {value:this[req[i]](dtpo,req), enumerable:true, configurable:true, writable:true});
          }
        },
        exe_sub : function(dtpo,req,i,j) {
          dtpo[req[i+2]][j].domain = dtpo.domain;
          dtpo[req[i+2]][j].board  = dtpo.board;
          this.entry(dtpo[req[i+2]][j],req[i+3]);
        },
        finisher : function(){return;},
        posts: function(){return undefined;},
        com: function(){return undefined;},
        flags: function(){return undefined;},
//        op_img_url: function() {return undefined;},
//        preventDefault:function(e){e.preventDefault();},
        th_init: null,
//        th_destroy: null,
        tn_as: function(th){return th.pn.getElementsByTagName('a');},
        tn_imgs: function(th){
          var imgs = [];
          for (var i=0;i<th.tn_as.length;i++) imgs[i] = th.tn_as[i].getElementsByTagName('img')[0];
          return imgs;
        },
        pn: function(th){return site2[th.domain].catalog_json2html3(th,th.board, this.op_img_url(th));},
        op_img_url: function(th) {return site2[th.domain].catalog_json2html3_thumbnail(th, th.board);},
        ths_array: function(doc,ths_col){
          var ths = [];
          if (ths_col)
            for (var i=ths_col.length-1;i>=0;i--) {
              var page = (doc.type_html==='catalog_html')? Math.floor(i/15)+'.'+i%15
                                                         : (doc.type_html==='page_html')? doc.page + '.' + i : undefined; // page_html
              ths[i] = {
                pn: ths_col[i],
                page: page,
                __proto__: doc.__proto__};
            }
          return ths;
        },
        ths_json: function(obj) {
          var ths = [];
          for (var i=0;i<obj.obj.length;i++)
            if (obj.obj[i].threads) for (var j=0;j<obj.obj[i].threads.length;j++) {
              obj.obj[i].threads[j].page = i + '.' + j;
              obj.obj[i].threads[j].sticky = obj.obj[i].threads[j].sticky===1; // overwrite property of the same name before setting prototype to use polarity.
              obj.obj[i].threads[j].type_html = 'catalog_html';
              obj.obj[i].threads[j].__proto__ = obj.__proto__;
              ths[ths.length] = obj.obj[i].threads[j];
            }
          return ths;
        },
        time_posted : function(th){return undefined;},
        time_unit: 1,
        has_posts: true,
        last_replies: function(th){return th.posts.slice(1);},
        post_no: function(post){return post.no;},
        txt: function(th){
          site2['DEFAULT'].parse_pn_dummy.innerHTML = th.com;
          return site2['DEFAULT'].parse_pn_dummy[brwsr.innerText];
        },
      },    
      'catalog_html': {
        has_posts: false,
      },
      'catalog_json': { 
        has_posts: false,
      },
//      'catalog_html': {
//        ths_array: function(doc,ths_col){ // working code.
//          var ths = [];
//          if (ths_col)
////            if (site.nickname!==doc.domain) site2[doc.domain].absolute_link(doc.pn, doc.board);
//            for (var i=ths_col.length-1;i>=0;i--) {
//              var page = Math.floor(i/15)+'.'+i%15;
//              ths[i] = {
//                pn: ths_col[i],
//                type_html: 'catalog_html',
////                page: Math.floor(i/15)+'.'+i%15, // cause warning of 'Object literal with complex property' in V8.
//                page: page,
//                __proto__: doc.__proto__};
//            }
//          return ths;
//        },
//      },
      'page_html': {
//        ths_array: function(doc,ths_col){ // working code.
//          var ths = [];
//          if (ths_col)
////            if (site.nickname!==doc.domain) site2[doc.domain].absolute_link(doc.pn, doc.board);
//            for (var i=ths_col.length-1;i>=0;i--) {
//              var page = (doc.page!=='?')? doc.page + '.' + i : doc.page;
//              ths[i] = {
//                pn: ths_col[i],
//                type_html: 'page_html',
////                page: (doc.page!=='?')? doc.page + '.' + i : doc.page, // cause warning of 'Object literal with complex property' in V8.
//                page: page,
//                __proto__: doc.__proto__};
//            }
//          return ths;
//        },
        posts_array: function(th,posts){ // working code.
          var pts = [];
if (!pref.test_mode['5']) { // faster, because object creation is light,,,orz,,,
          for (var i=0;i<posts.length;i++) pts[pts.length] = {pn:posts[i], __proto__:th.__proto__};
} else {
          pts.pns = posts;
          pts.idx0 = 0;
          pts.idx1 = posts.length-1;
          pts.get0 = this.posts_get0;
          pts.get1 = this.posts_get1;
          pts.proto = th.__proto__;
//          var pts = {pn:posts, idx0:0, idx1:posts.length-1, length:posts.length, __proto__:th.__proto__};
          Object.defineProperty(pts, pts.idx0, {get: pts.get0, enumerable:true, configurable:true});
          Object.defineProperty(pts, pts.idx1, {get: pts.get1, enumerable:true, configurable:true});
}
          return pts;
        },
        posts_get0: function(){
//console.log('get0: '+this.idx0);
          var val = {pn:this.pns[this.idx0],  __proto__:this.proto}; // this.__proto__ reffers Array, doesn't work.
          Object.defineProperty(this, this.idx0, {value: val, enumerable:true, configurable:true, writable:true});
          if (++this.idx0<this.idx1) Object.defineProperty(this, this.idx0, {get: this.get0, enumerable:true, configurable:true});
          return val;
        },
        posts_get1: function(){
//console.log('get1: '+this.idx1);
//console.log('this.pns: ');
//console.log(this.pns);
          var val = {pn:this.pns[this.idx1],  __proto__:this.proto};
          Object.defineProperty(this, this.idx1, {value: val, enumerable:true, configurable:true, writable:true});
          if (--this.idx1>this.idx0) Object.defineProperty(this, this.idx1, {get: this.get1, enumerable:true, configurable:true});
          return val;
        },
//        posts_array: function(th,posts){ // working code.
//          var pts = [];
//          for (var i=0;i<posts.length;i++) pts[pts.length] = {pn:posts[i], __proto__:th.__proto__};
//          return pts;
//        },
        posts: function(th){return this.posts_array(th, th.pn.getElementsByClassName('post'));},
        time_posted: function(th){return th.posts[th.posts.length-1].time;},
        time_bumped: function(th){ // TO BE FIXED.
          return th.posts[th.posts.length-1].time;
        },
        time_created: function(th){return th.posts[0].time;},
        key: function(th){return th.domain + th.board + th.no;},
        insert_footer4: function(ref){
          var footer = document.createElement('div');
          return ref.parentNode.insertBefore(footer,ref);
        },
        flags: function(th){ // for on demand access.
          var flags = [];
          var i = th.posts.length -1;
          var n = pref.catalog_t2h_num_of_posts -1;
          if (i<n) { // POSTS MUST BE ACCESSED FROM HEAD OR TAIL.
            n=0;
            while (n<=i) {
//console.log('up: '+n+', '+i);
              if (th.posts[n]) flags[n] = th.posts[n].flag; // 8chan doesn't show 5 posts all the time.
              n++;
            }
          } else {
            while (n>=0) {
//console.log('down: '+n+', '+i);
//console.log(th.posts[i]);
              if (th.posts[i]) flags[n--] = th.posts[i--].flag;
              if (n==0) i=0;
            }
          }
          return flags;
        },
////        flags: function(th){ // for on demand access. // worked code, but post was changed to had to be accessed from top or end.
////          var flags = [];
////          var i = th.posts.length - pref.catalog_t2h_num_of_posts;
////          if (i<1) i=1;
////          if (th.posts.length!=0) flags[0] = th.posts[0].flag;
////          while (i<th.posts.length) {
////            if (th.posts[i]) flags[i] = th.posts[i].flag;
////            i++;
////          }
////          return flags;
////        },
        html_org: function(th){return th.pn.innerHTML;},
        sticky: function(){return false;},
////        pop_post_prep: function(th){ // working code.
////          th.children = th.pn.childNodes;
////          th.idx_pop = th.pn.childNodes.length-1;
////        },
      },
      'thread_html'  : {
        ths_array: function(doc, ths_col){
          return [{pn:ths_col,
//                   type_html: 'thread_html',
                   page: '?',
                   __proto__: doc.__proto__}];
        },
        time_posted : function(th){return th.posts[th.posts.length-1].time;},
      },
      'thread_json'  : {
////        pop_post_prep: function(obj){ // working code.
////          obj.idx_pop = obj.posts.length-1;
////        },
////        pop_post: function(obj){
////          if (obj.idx_pop>=0) {
////            obj.post = obj.posts[obj.idx_pop--];
//////            obj.post.parse_funcs = this;
//////            obj.post.__proto__ = obj.__proto__;
////            obj.post.time *= 1000; // DESTRUCTIVE
////            return true;
////          } else return false;
////        },
////        preprocess: function(obj){ // working code, but deleted.
////          if (!obj.preprocessed) {
////            obj.preprocessed = true;
////            for (var i=obj.posts.length-1;i>=0;i--) obj.posts[i].time *= 1000;
////          }
////        },
////        time_created : function(obj){return obj.posts[0].time;}, // preprocessed
////        time_bumped : function(obj){return obj.posts[obj.posts.length-1].time;}, // preprocessed
        time_created : function(obj){return obj.posts[0].time*1000;},
        time_bumped : function(obj){
          i = obj.posts.length-1;
          while (i>=0) if (!obj.posts[i].email || obj.posts[i].email!=='sage') return obj.posts[i].time*1000; else i--;
          return obj.posts[0].time*1000;
        },
        time_posted : function(obj){return obj.posts[obj.posts.length-1].time*1000;},
        nof_posts: function(obj){return obj.posts[0].replies+1;},
        nof_files: function(obj){return obj.posts[0].images+1;},
        has_nof_files: true,
        sub: function(obj){return (obj.posts[0].sub || '');},
        name: function(obj){return (obj.posts[0].name || '');},
        com: function(obj){return (obj.posts[0].com || '');},
        sticky: function(obj){return obj.posts[0].sticky===1;},
        time_unit: 1000,
//        proto: 'page_json'
      },
    },
//    parse_funcs : function(dtp,req) { // doc, thread, post, use .call() to call with 'this'.
//      for (var i=0;i<req.length;i++) {
//        if (this[req[i]]) dtp[req[i]] = this[req[i]](dtp,req);
//        if (req[i]==='ths') i++;
//      }
//    },
    parse_parts:{
      add_op_img_url: function(posts,board,domain){
         for (var i=0;i<posts.length;i++)
          posts[i].op_img_url = site2[domain].catalog_json2html3_thumbnail(posts[i], board);
      },
    },
////    update_posts_replace: function(th,th_old,pnode) { // working code.
////      if (th_old.posts) {
////        th_old.posts[0].pn.innerHTML = th.posts[0].pn.innerHTML;
////        for (var i=th_old.posts.length-1;i>=1;i--) this.update_posts_remove(th_old,i,pnode);
////      }
////      th_old.posts = [th_old.posts[0]];
////      this.update_posts_add(th,th_old,pnode);
////    },
    update_posts_replace: function(th,th_old,pnode) {
      if (th_old.posts) {
        th_old.posts[0].pn.innerHTML = th.posts[0].pn.innerHTML;
//        this.format_pn(th_old.posts[0].pn, liveTag.mems[th.domain][th.board][th.no].q[th_old.posts[0].no]); // cause error
        var nos = {};
        for (var i=1;i<th.posts.length;i++) nos[th.posts[i].no] = null;
        for (var i=th_old.posts.length-1;i>=1;i--) 
          if (nos[th_old.posts[i].no]===undefined) {
            this.update_posts_remove(th_old,i,pnode);
            th_old.posts.splice(i,1);
          }
      }
      this.update_posts_add(th,th_old,pnode);
    },
    update_posts_add: function(th,th_old,pnode) {
      if (th_old.posts && th.posts) {
        var thq = liveTag.mems[th.domain][th.board][th.no].q;
        for (var i=1;i<th.posts.length;i++) {
          if (th.posts[i].no>th_old.posts[th_old.posts.length-1].no) {
            this.update_posts_insert(th,th_old,i,pnode);
            this.format_pn(th.posts[i].pn, thq[th.posts[i].no]);
//            this.format_pn(th.posts[i].pn, th_old.q[th.posts[i].no]); // WILL BE THIS.
            th_old.posts[th_old.posts.length] = th.posts[i];
          }
        }
      }
    },
////    update_posts_add: function(th,th_old,pnode) { // working code.
////      var ref = th_old.posts[0].nextSibling || null;
////      for (var i=0;i<th.posts.length;i++) {
////        if (th.posts[i].no>th_old.posts[th_old.posts.length-1].no) {
////          pnode.appendChild(document.createElement('br'));
////          pnode.appendChild(this.post_container(th.posts[i].pn || this.post_json2html(th.posts[i],th.posts.board),th.posts[i].no));
////          th_old.posts[th_old.posts.length] = th.posts[i];
////        }
////      }
////    },
  };
  site2['common'] = { // common functions
    absorb_children: function(pn){
      var container = document.createElement('div');
      while (pn.childNodes.length!=0) container.appendChild(pn.childNodes[0]);
      pn.appendChild(container);
      return container;
    },
    disgorge_children: function(pn){
      while (pn.childNodes.length!=0) pn.parentNode.appendChild(pn.childNodes[0]);
      pn.parentNode.removeChild(pn);
    },
    remove_by_classname : function(pn,classname,end,remove_br){
      if (end===undefined) end = 0;
      var tgts = pn.getElementsByClassName(classname);
      for (var i=tgts.length-1-end;i>=0;i--) {
        if (remove_br && tgts[i].nextSibling && tgts[i].nextSibling.tagName==='BR') tgts[i].parentNode.removeChild(tgts[i].nextSibling);
//if (!pref.test_mode['14']) tgts[i].setAttribute('style','display:none;'+(tgts[i].getAttribute('style') || ''));
//else
        tgts[i].parentNode.removeChild(tgts[i]);
      }
    },
//    remove_by_classname : function(pn,classname,end,remove_br){ // cause document leak in Chrome at 4chan/a/.
//      if (end===undefined) end = 0;
//      var tgts = pn.getElementsByClassName(classname);
//      for (var i=tgts.length-1-end;i>=0;i--) {
//        if (remove_br && tgts[i].nextSibling && tgts[i].nextSibling.outerHTML==='<br>') tgts[i].parentNode.removeChild(tgts[i].nextSibling);
//        tgts[i].parentNode.removeChild(tgts[i]);
//      }
//    },
    remove_by_tagname : function(pn,tagname,end){
      if (end===undefined) end = 0;
      var tgts = pn.getElementsByTagName(tagname);
      for (var i=tgts.length-1-end;i>=0;i--) tgts[i].parentNode.removeChild(tgts[i]);
    },
    remove_by_attribute : function(pns,attr_name,attr_val){ // pns must be array.
      for (var i=pns.length-1;i>=0;i--)
        for (var j=pns[i].childNodes.length-1;j>=0;j--)
          if (pns[i].childNodes[j].getAttribute)
            if (pns[i].childNodes[j].getAttribute(attr_name))
              if (pns[i].childNodes[j].getAttribute(attr_name).search(attr_val)!=-1) pns[i].removeChild(pns[i].childNodes[j]);
    },
    remove_attribute : function(doc,attr_name){
      var pns = doc.getElementsByTagName('*');
      for (var i=pns.length-1;i>=0;i--)
        if (pns[i].getAttribute && pns[i].getAttribute(attr_name)) pns[i].removeAttribute(attr_name);
    },
    add_attribute_by_classname : function(pn,classname,attr_name,attr_val){
      var tgts = pn.getElementsByClassName(classname);
      for (var i=tgts.length-1;i>=0;i--) tgts[i].setAttribute(attr_name,attr_val);
    },
    add_attribute_by_tagname : function(pn,tagname,attr_name,attr_val){
      var tgts = pn.getElementsByTagName(tagname);
      for (var i=tgts.length-1;i>=0;i--) tgts[i].setAttribute(attr_name,attr_val);
    },
    add_attribute_by_attribute : function(pns,attr_name,attr_val,attr_name2,attr_val2){ // pns must be array.
      for (var i=pns.length-1;i>=0;i--)
        for (var j=pns[i].childNodes.length-1;j>=0;j--)
          if (pns[i].childNodes[j].getAttribute)
            if (pns[i].childNodes[j].getAttribute(attr_name))
              if (pns[i].childNodes[j].getAttribute(attr_name).search(attr_val)!=-1) pns[i].setAttribute(attr_name2,attr_val2);
    },
    move_up_and_delete_parent : function(pns){
      for (var i=0;i<pns.length;i++) {
        var parent = pns[i].parentNode;
        var g_parent = parent.parentNode;
        g_parent.insertBefore(pns[i],parent);
        g_parent.removeChild(parent);
      }
    },
    remove_last_hrs_and_brs : function(th){
      while (1) {
        var last_node = th.childNodes[th.childNodes.length-1];
        if (last_node.tagName !== 'HR' && last_node.tagName !== 'BR') break;
        else th.removeChild(last_node);
      }
    },
    remove_brs : function(elem){
      var tgts = elem.getElementsByTagName('br');
      for (var i=tgts.length-1;i>=0;i--) tgts[i].parentNode.removeChild(tgts[i]);
    },
    remove_double_br : function(elem){
      var elems = elem.getElementsByTagName('*');
      for (var i=elems.length-2;i>=0;i--)
//        if (elems[i].outerHTML=='<br>' && elems[i+1].outerHTML=='<br>') elems[i+1].parentNode.removeChild(elems[i+1]); // CAN'T FIND STRINGS WITHOUT TAGS.
        if (elems[i].outerHTML==='<br>' && elems[i].nextSibling && elems[i].nextSibling.tagName==='BR') elems[i].parentNode.removeChild(elems[i].nextSibling);
    },
    remove_double_tags : function(elem,tag){
      var elems = elem.getElementsByTagName('*');
      for (var i=elems.length-2;i>=0;i--) {
        if (elems[i].tagName===tag && elems[i+1].tagName===tag) elems[i+1].parentNode.removeChild(elems[i+1]);
      }
    },
    change_utc_to_local : function(utc_str){
      var date = new Date(utc_str);
//      return date.toString().replace(/\ GMT.*/,'');
      return date.toLocaleString().replace(/\ /,' ('+date.toString().replace(/\ .*/,'')+') ');
    },
////////    thread2headline : function(doc,nickname){
////////      var retval  = site2[nickname].insert_footer(doc,0,'t2h',false,0,0,0);
////////      site2[nickname].remove_posts(doc,pref.catalog_t2h_num_of_posts);
////////      site2.common.remove_double_br(doc);
////////      var retval2 = site2[nickname].insert_footer(doc,0,'t2h',false,0,0,0);
////////      return [retval[0]-retval2[0], retval[1]-retval2[1]];
////////    },
  };
  site4 = {
   tb_prep_for_embed: function(tb){
     tb.childNodes[0].innerHTML = '';
     tb.childNodes[1].innerHTML = '';
     tb.childNodes[0].draggable = false;
     tb.childNodes[3].ondblclick = null;
     tb.childNodes[3].draggable = false;
     tb.childNodes[3].removeAttribute('style');
   },
////////
//////// TUNING RESULTS to parse entire 4chan by chrome, (avarage of 3 times)
////////     TYPE1: written in flat with 'exe_sub'. (traditional)
////////     TYPE2: written in array with 'exe_sub'.
////////     TYPE3: written in array.
////////     TYPE4: written in array systematically.
////////     TYPE5: written in flat.
////////   results(ms): (idle), (program), (anonymous_function), usage. 
////////     TYPE1: 179164.7, 24936.9, 12598.6, 17.3%
////////     TYPE2: 165382.5, 35503.6, 14546.3, 23.2%
////////     TYPE3: 169261.9, 23509.1, 13727.0, 18.0%
////////     TYPE4: 159156.4, 37429.6, 14104.5, 24.5%
////////     TYPE5: 159990.8, 32805.5, 14998.7, 23.0%
////
////    parse_funcs_getters: {}, // works.
////    parse_funcs_getters: Object.create(null), // THIS DOESN'T WORK.
////    parse_funcs_getters: (function(){ // works if '{}'
//////      var obj = Object.create(null); // DOESN'T WORK, probably introduce problem to make prototype chain using '__proto__'.
////      var obj = {}; // works.
////      var props=['no','ths','key','time_bumped','nof_posts','nof_files','time_created','posts','sub','name','com','flag','flags',
////                 'footer','sticky','format','pn','pn_name','time','time_posted','tn_as','tn_imgs','op_img_url','post_no'];
////      for (var i=0;i<props.length;i++) Object.defineProperty(obj,props[i],{get:(function(prop){return function(){return this.exe_sub(prop);}})(props[i]), enumerable:true});
////      return obj;
////    })(),
////
    parse_funcs_getters: { // working code. // TYPE1
      get no() {return this.exe_sub('no');},
      get ths() {return this.exe_sub('ths');},
      get key() {return this.exe_sub('key');},
      get time_bumped() {return this.exe_sub('time_bumped');},
      get nof_posts() {return this.exe_sub('nof_posts');},
      get nof_files() {return this.exe_sub('nof_files');},
      get time_created() {return this.exe_sub('time_created');},
      get posts() {return this.exe_sub('posts');},
      get sub() {return this.exe_sub('sub');},
      get name() {return this.exe_sub('name');},
      get com() {return this.exe_sub('com');},
      get flag() {return this.exe_sub('flag');},
      get flags() {return this.exe_sub('flags');},
      get footer() {return this.exe_sub('footer');},
      get sticky() {return this.exe_sub('sticky');},
      get format() {return this.exe_sub('format');},
      get pn() {return this.exe_sub('pn');},
      get pn_name() {return this.exe_sub('pn_name');},
      get time() {return this.exe_sub('time');},
      get time_posted() {return this.exe_sub('time_posted');},
//      get html_org() {return this.exe_sub('html_org');},
      get tn_as() {return this.exe_sub('tn_as');},
      get tn_imgs() {return this.exe_sub('tn_imgs');},
      get op_img_url() {return this.exe_sub('op_img_url');},
      get post_no() {return this.exe_sub('post_no');},
      get last_replies() {return this.exe_sub('last_replies');},   // CAUTION. ADDED AFTER TUNING.
      get txt() {return this.exe_sub('txt');},   // CAUTION. ADDED AFTER TUNING.
    },
////    parse_funcs_on_demand : { // TYPE5
////      get no() {return Object.defineProperty(this,'no',{value:this.parse_funcs['no'](this), enumerable:true, configurable:true, writable:true})['no'];},
////      get ths() {return Object.defineProperty(this,'ths',{value:this.parse_funcs['ths'](this), enumerable:true, configurable:true, writable:true})['ths'];},
////      get key() {return Object.defineProperty(this,'key',{value:this.parse_funcs['key'](this), enumerable:true, configurable:true, writable:true})['key'];},
////      get time_bumped() {return Object.defineProperty(this,'time_bumped',{value:this.parse_funcs['time_bumped'](this), enumerable:true, configurable:true, writable:true})['time_bumped'];},
////      get nof_posts() {return Object.defineProperty(this,'nof_posts',{value:this.parse_funcs['nof_posts'](this), enumerable:true, configurable:true, writable:true})['nof_posts'];},
////      get nof_files() {return Object.defineProperty(this,'nof_files',{value:this.parse_funcs['nof_files'](this), enumerable:true, configurable:true, writable:true})['nof_files'];},
////      get time_created() {return Object.defineProperty(this,'time_created',{value:this.parse_funcs['time_created'](this), enumerable:true, configurable:true, writable:true})['time_created'];},
////      get posts() {return Object.defineProperty(this,'posts',{value:this.parse_funcs['posts'](this), enumerable:true, configurable:true, writable:true})['posts'];},
////      get sub() {return Object.defineProperty(this,'sub',{value:this.parse_funcs['sub'](this), enumerable:true, configurable:true, writable:true})['sub'];},
////      get name() {return Object.defineProperty(this,'name',{value:this.parse_funcs['name'](this), enumerable:true, configurable:true, writable:true})['name'];},
////      get com() {return Object.defineProperty(this,'com',{value:this.parse_funcs['com'](this), enumerable:true, configurable:true, writable:true})['com'];},
////      get flag() {return Object.defineProperty(this,'flag',{value:this.parse_funcs['flag'](this), enumerable:true, configurable:true, writable:true})['flag'];},
////      get flags() {return Object.defineProperty(this,'flags',{value:this.parse_funcs['flags'](this), enumerable:true, configurable:true, writable:true})['flags'];},
////      get footer() {return Object.defineProperty(this,'footer',{value:this.parse_funcs['footer'](this), enumerable:true, configurable:true, writable:true})['footer'];},
////      get sticky() {return Object.defineProperty(this,'sticky',{value:this.parse_funcs['sticky'](this), enumerable:true, configurable:true, writable:true})['sticky'];},
////      get format() {return Object.defineProperty(this,'format',{value:this.parse_funcs['format'](this), enumerable:true, configurable:true, writable:true})['format'];},
////      get pn() {return Object.defineProperty(this,'pn',{value:this.parse_funcs['pn'](this), enumerable:true, configurable:true, writable:true})['pn'];},
////      get pn_name() {return Object.defineProperty(this,'pn_name',{value:this.parse_funcs['pn_name'](this), enumerable:true, configurable:true, writable:true})['pn_name'];},
////      get time() {return Object.defineProperty(this,'time',{value:this.parse_funcs['time'](this), enumerable:true, configurable:true, writable:true})['time'];},
////      get time_posted() {return Object.defineProperty(this,'time_posted',{value:this.parse_funcs['time_posted'](this), enumerable:true, configurable:true, writable:true})['time_posted'];},
//////      get html_org() {return Object.defineProperty(this,'html_org',{value:this.parse_funcs['html_org'](this), enumerable:true, configurable:true, writable:true})['html_org'];},
////      get tn_as() {return Object.defineProperty(this,'tn_as',{value:this.parse_funcs['tn_as'](this), enumerable:true, configurable:true, writable:true})['tn_as'];},
////      get tn_imgs() {return Object.defineProperty(this,'tn_imgs',{value:this.parse_funcs['tn_imgs'](this), enumerable:true, configurable:true, writable:true})['tn_imgs'];},
////      get op_img_url() {return Object.defineProperty(this,'op_img_url',{value:this.parse_funcs['op_img_url'](this), enumerable:true, configurable:true, writable:true})['op_img_url'];},
////      get post_no() {return Object.defineProperty(this,'post_no',{value:this.parse_funcs['post_no'](this), enumerable:true, configurable:true, writable:true})['post_no'];},
////    },
    parse_funcs_on_demand : {},
    parse_funcs_on_demand_debug : {},
    parse_funcs_no_cache: {},
    parse_funcs_one_time: {}
  };
////  var props=['no','ths','key','time_bumped','nof_posts','nof_files','time_created','posts','sub','name','com','flag','flags', // works.
////             'footer','sticky','format','pn','pn_name','time','time_posted','tn_as','tn_imgs','op_img_url','post_no'];
////  for (var i=0;i<props.length;i++)
//////    Object.defineProperty(site4.parse_funcs_getters,props[i],{get:(function(prop){return function(){return this.exe_sub(prop);}})(props[i]), enumerable:true}); // TYPE2
////    Object.defineProperty(site4.parse_funcs_on_demand,props[i],{get:(function(prop){ // WORKS // TYPE3
////      return function(){
////        return Object.defineProperty(this,prop,{value:this.parse_funcs[prop](this), enumerable:true, configurable:true, writable:true})[prop];
////      }})(props[i]), enumerable:true});
  site4.parse_funcs_on_demand = { // working code. // TYPE1,2
    exe_sub : function(prop){return Object.defineProperty(this,prop,{value:this.parse_funcs[prop](this), enumerable:true, configurable:true, writable:true})[prop];},
    __proto__: site4.parse_funcs_getters
  }
  site4.parse_funcs_on_demand_debug = {
    exe_sub : function(prop){
      try {
        return Object.defineProperty(this,prop,{value:this.parse_funcs[prop](this), enumerable:true, configurable:true, writable:true})[prop];
      } catch(e) {
        console.log('parse_error: '+this.key+', '+this.type_parse+', '+prop);
        console.trace();
        console.log(this);
      }
    },
    __proto__: site4.parse_funcs_getters
  }
  site4.parse_funcs_no_cache = {
    exe_sub : function(prop){return this.parse_funcs[prop](this);},
    __proto__: site4.parse_funcs_getters
  }
  site4.parse_funcs_one_time = {
    get posts() {return Object.defineProperty(this,'posts',{value:this.parse_funcs['posts'](this), enumerable:true, configurable:true, writable:true})['posts'];},
    exe_sub : function(prop){return this.parse_funcs[prop](this);},
    __proto__: site4.parse_funcs_getters
  }

////  (function (){ // WORKS, BUT TOO SLOW // TYPE4
////    var props=['no','ths','key','time_bumped','nof_posts','nof_files','time_created','posts','sub','name','com','flag','flags', // works.
////               'footer','sticky','format','pn','pn_name','time','time_posted','tn_as','tn_imgs','op_img_url','post_no'];
////    for (var i=0;i<props.length;i++) {
////      var func = (function(prop){return function(){
////                   return Object.defineProperty(this,prop,{value:this.parse_funcs[prop](this), enumerable:true, configurable:true, writable:true})[prop];
////                 }})(props[i]);
////      var func_no_cache = (function(prop){return function(){
////                   return this.parse_funcs[prop](this);
////                 }})(props[i]);
////      var func_debug = (function(func,prop){return function(){
////                         try {
//////                           return func();  // THIS DOESN'T WORK, WHY???
////                           return Object.defineProperty(this,prop,{value:this.parse_funcs[prop](this), enumerable:true, configurable:true, writable:true})[prop]; // works.
////                         } catch(e) {
////                           console.log('parse_error: '+this.key+', '+this.type_parse);
////                         }
////                       }})(func,props[i]);
////      Object.defineProperty(site4.parse_funcs_on_demand,props[i],{get:func, enumerable:true});
////      Object.defineProperty(site4.parse_funcs_on_demand_debug,props[i],{get:func_debug, enumerable:true});  // NOT DEBUGGED YET
////      Object.defineProperty(site4.parse_funcs_no_cache,props[i],{get:func_no_cache, enumerable:true});  // NOT DEBUGGED YET
////      if (props[i]!=='posts') Object.defineProperty(site4.parse_funcs_one_time,props[i],{get:func, enumerable:true});  // NOT DEBUGGED YET
////      else Object.defineProperty(site4.parse_funcs_one_time,props[i],{get:func_no_cache, enumerable:true});
////    }
////  })();

  site2['8chan'] = {
    nickname : '8chan',
    domain_url : '8ch.net',
//    home : site.protocol + '//8chan.co/faq.html', // stop twitter and IRC access.
    home : site.protocol + '//8ch.net/faq.html', // stop twitter and IRC access.
    protocol : 'https:',
    features : {uip_tracker: true},
    pref_default: {
      catalog_expand_with_hr: true,
    },
    check_func : function(){
      var href = window.location.href;
      if (href.search(/8chan.co|8ch.net/)!=-1) { // 8chan
        site2['8chan'].domain_url = (href.search(/8ch.net/)!=-1)? '8ch.net' : '8chan.co';
        site2['8chan'].home = site.protocol + '//' + site2['8chan'].domain_url + '/faq.html',
        site.config(site2['8chan'].domain_url,'8chan');
        site.header_height = function(){
          var header = document.getElementsByClassName('boardlist')[0];
          if (header) return header.offsetHeight;
          else return 0;
        }
        site.postform = document.getElementsByTagName('form')[0];
        site.postform_comment = document.getElementById('body');
//        if (site.features.post && site.postform) site.postform_submit = site.postform.childNodes[5].childNodes[0].childNodes[2].childNodes[1].childNodes[1];
//        if (site.postform) { // working code.
//          site.postform_submit = site.postform.querySelector('input[name=post]');
//          site.postform_submit2 = null;
//          site.postform_submit2_observer = new MutationObserver(this.postform_submit2_find);
//          site.postform_submit2_observer.observe(document.getElementsByTagName('body')[0], {childList: true});
//        }
        if (site.postform) this.postform_prep();
        site.max_page = site2['8chan'].max_page(site.board);
        pref.catalog.on_bt_page = href.search(site2['8chan'].domain_url + '/boards.html')!=-1;
        site.catalog = href.search(/catalog\.html/)!=-1;
        site.whereami = (document.getElementsByTagName('header')[0].innerHTML.indexOf('404 Not Found')!=-1)? '404'
                      : (href.search(/8ch\.net\/?$/)!=-1)? 'frame'
                      : (href.search(/catalog\.html/)!=-1)? 'catalog'
                      : (href.search(/res\/[0-9\+]*\.html/)!=-1)? 'thread'
                      : (href.search(/\/$|(index|[0-9]+)\.html|\/#all$/)!=-1)? 'page'
                      : 'other';
        if (site.whereami==='thread' || site.whereami==='page') {
          site.embed_to['top']    = document.getElementsByName('postcontrols')[0];
          site.embed_to['bottom'] = document.getElementsByClassName('boardlist bottom')[0];
        } else if (site.whereami==='catalog') {
          site.embed_to['top']    = document.getElementsByTagName('header')[0].nextSibling;
          site.embed_to['bottom'] = document.getElementsByTagName('footer')[0];
        }
//        site.boardlist = document.getElementsByClassName('boardlist')[0];
        if (site.boardlist) site.boardlist.style.zIndex = 0;
        return true;
      } else {
        if (!brwsr.ff) {
          site2['8chan'].protocol = 'https:';
          site2['8chan'].home = site2['8chan'].protocol + '//' + site2['8chan'].domain_url + '/faq.html';
        }
        return false;
      }
    },
    postprocess_board: function(val){
      site3[this.nickname].boards = [];
      for (var i=0;i<val.length;i++) {
        if (val[i].max) {
          var bd = liveTag.mems.init({domain:this.nickname, board:'/'+val[i].uri+'/'});
          site3[this.nickname].boards.push(bd);
          Object.defineProperty(bd,'max',{value:parseInt(val[i].max,10), writable:true});
          if (bd.read_max===undefined) Object.defineProperty(bd,'read_max',{value:0, writable:true});
          if (val[i].tags && val[i].tags.length!=0) {
            for (var j=0;j<val[i].tags.length;j++) {
              val[i].tags[j].replace(/[&<>'"]/g,'');
              val[i].tags[j] = '#'+val[i].tags[j];
              if (val[i].tags[j].length>pref.liveTag.maxstr) val[i].tags.splice(j--,1);
            }
            var flag = bd.btag2 && bd.btag2.length===val[i].tags.length;
            if (flag) for (var j=0;j<val[i].tags.length;j++) if (val[i].tags[j]!==bd.btag2[j]) {flag = false;break;}
            if (!flag) {
              Object.defineProperty(Object.getPrototypeOf(bd),'btag2',{value:val[i].tags, writable:true});
              for (var j=0;j<val[i].tags.length;j++) {
                var btag2_1 = val[i].tags[j];
                var ref_tag = (liveTag.tags[btag2_1])? liveTag.tags[btag2_1].ref_tag : null;
                if (btag2_1===ref_tag) { // force to use the same pointer to reduce memory consumption.
                  val[i].tags[j] = ref_tag;
                  btag2_1 = ref_tag;
                }
                liveTag.update_tags_in_th_sub([], {}, [btag2_1], {}, 1, bd, 0, null);
//                liveTag.tags[btag].ref_tag = btag2_1; // set btag reference.
                if (pref.liveTag.inherit_board_tags) liveTag.tags[btag2_1].mems.set(bd,btag2_1);
//                liveTag.key_dirty[liveTag.tags_ci[(pref.liveTag.ci)? btag2_1.toLowerCase() : btag2_1].key] = null;
              }
              if (pref.liveTag.inherit_board_tags) {
                for (var j in bd) {
                  var th_key = this.nickname+'/'+val[i].uri+'/'+bd[j].no;
                  liveTag.prep_tags({domain:this.nickname, board:'/'+val[i].uri+'/', no:bd[j].no, key:th_key}, [bd[j].tl, bd[j].t]);
                  if (cataLog.threads[th_key]) cataLog.insert_footer3(th_key,null,null,bd[j]);
                }
              }
            }
          }
        }
      }
    },
    set_max_page: function(){return site2['vichan'].set_max_page() -1;},
////    enumerate_boards_to_scan:function(){
////      var obj = [];
////      var end = (site3[site.nickname].boards.length > pref.scan.max)? pref.scan.max : site3[site.nickname].boards.length;
////      for (var i=0;i<end;i++) 
////        if (site3[site.nickname].boards[i].max) obj[obj.length] = '/'+site3[site.nickname].boards[i].uri+'/';
////      return obj;
////    },
////    make_site3_bds:function(){ // working code.
////      var tgts = site3[site.nickname].boards;
////      for (var i=0;i<tgts.length;i++) site3[this.nickname].bds['/'+tgts[i].uri+'/'] = tgts[i].max;
////    },
    catalog_frame_prep: function(pn12){
      document.getElementsByTagName('header')[0].style.display='none';
      document.getElementsByClassName('footer')[0].style.display = 'none';
      var frame_menu = document.getElementsByClassName('menuCol')[0];
      frame_menu.firstChild.style.display='none';
      var frame_main = document.getElementsByClassName('bodyCol')[0];
      frame_main.firstChild.style.display = 'none';
      frame_menu.insertBefore(pn12,frame_menu.firstChild);
      var ifrm = this.catalog_native_frame_prep_frame(frame_main,frame_main.firstChild);
      this.catalog_embed_prep(pn12);
    },
//    postform_submit2_find: function(){
//      var postform_qr = document.querySelectorAll('input[name=post]')[1]; // quick reply
//      if (!site.postform_submit2 && postform_qr) {
//        site.postform_submit2 = postform_qr;
////        site.postform_submit2_observer.disconnect();
////        delete site.postform_submit2_observer;
//        if (common_obj.thread_reader) common_obj.thread_reader.add_event_to_submit(site.postform_submit2);
//      } else if (site.postform_submit2 && !postform_qr) {
//        if (common_obj.thread_reader) common_obj.thread_reader.remove_event_from_submit(site.postform_submit2);
//        site.postform_submit2 = null;
//      }
//    },
    prep_own_posts_event : function(e){
      if (e && e.key==='own_posts') site2['8chan'].prep_own_posts();
      if (window.name==='8chan') send_message('parent',[['OWN_POSTS', window.name, site3[window.name].own_posts]]);
    },
    prep_own_posts : function(){
      var own_posts = {};
      var obj = JSON.parse(localStorage.getItem('own_posts'));
      for (var i in obj) {
        var board = '/'+i+'/';
        own_posts[board] = {};
        for (var j=0;j<obj[i].length;j++) own_posts[board][obj[i][j]] = null;
      }
//      for (var i in obj)
//        for (var j=0;j<obj[i].length;j++)
//          own_posts['/'+i+'/'+obj[i][j]] = null;
//console.log(own_posts);
      site3['8chan'].own_posts = own_posts;
    },
////    format_thread_always : function(th){
////////      site2.common.remove_last_hrs_and_brs(th); // working code.
////      if (th.nextSibling && th.nextSibling.tagName==='HR') th.appendChild(th.nextSibling);
////      else th.appendChild(document.createElement('hr'));
////    },

    parse_funcs : { // 8chan
      'catalog_html' : {
//        ths: function(doc,req){
//          var req2 = req[req.indexOf('ths')+1];
//          var mixs = doc.pn.getElementsByClassName('mix');
//          var ths = [];
//          for (var i=0;i<mixs.length;i++) if (mixs[i].tagName==='DIV') {
//            ths.push({pn:mixs[i], board:doc.board, domain:doc.domain});
//            site2['DEFAULT'].parse_funcs.call(this,ths[ths.length-1],req2);
//          }
//          return ths;
//        },
        before_test : ['ths',':ITER',':ALL','ths',['key','time_bumped','nof_posts','nof_files']],
        after_test  : ['time_created','sub','name','com','footer','sticky','format'],
        full_hier   : ['ths',':ITER',':ALL','ths',['key','time_bumped','nof_posts','nof_files','time_created','sub','name','com','footer','sticky','format']],
//        full_th     : ['key','time_bumped','nof_posts','nof_files','sub','name','com','footer','sticky'],
        ths: function(doc) {
          var mixs = doc.pn.getElementsByClassName('mix');
          var ths = [];
if (pref.test_mode['0']) {
          for (var i=0;i<mixs.length;i++) if (mixs[i].tagName==='DIV') ths[ths.length] = {pn:mixs[i], page:Math.floor(i/15)+'.'+i%15};
} else { 
          for (var i=0;i<mixs.length;i++) if (mixs[i].tagName==='DIV') ths[ths.length] = mixs[i];
          ths = this.ths_array(doc,ths);
}
//          for (var i=0;i<ths.length;i++) ths[i].pn.getElementsByTagName('a')[0].addEventListener('click',this.preventDefault,false); // TEST, works.
          return ths;
        },
        th_init: function(th){
          var pn_child = th.pn.getElementsByTagName('div')[0];
//          pn_child.className = pn_child.className.replace(/grid\-size\-[a-z]*/,'grid-size-'+site2[th.domain].catalog_native_size); // BUG WHEN MIMICED.
          pn_child.className = pn_child.className.replace(/grid\-size\-[a-z]*/,'grid-size-'+site2['8chan'].catalog_native_size);
//          th.pn.getElementsByTagName('a')[0].removeAttribute('href');
//          th.pn.getElementsByTagName('a')[0].addEventListener('click',th.parse_funcs.preventDefault,false); // TEST
        },
//        th_destroy: function(pn, parse_funcs){
////          pn.getElementsByTagName('a')[0].removeEventListener('click',parse_funcs.preventDefault,false); // TEST
//        },
////        ths: function(doc) {
////          var mixs = doc.pn.getElementsByClassName('mix');
////          var ths = [];
////if (pref.test_mode['0']) {
////          for (var i=0;i<mixs.length;i++) if (mixs[i].tagName==='DIV') ths[ths.length] = {pn:mixs[i], page:Math.floor(i/15)+'.'+i%15};
////} else { 
//////          for (var i=0;i<mixs.length;i++) if (mixs[i].tagName==='DIV')
//////            ths[ths.length] = {pn:mixs[i], page:Math.floor(i/15)+'.'+i%15, type_html: 'catalog_html', __proto__:doc.__proto__};
////          for (var i=0;i<mixs.length;i++) if (mixs[i].tagName==='DIV') ths[ths.length] = mixs[i];
////          ths = this.ths_array(doc,ths);
////}
////          for (var i=0;i<ths.length;i++) {
////            var pn_child = ths[i].pn.getElementsByTagName('div')[0];
////            pn_child.className = pn_child.className.replace(/grid\-size\-[a-z]*/,'grid-size-'+site2['8chan'].catalog_native_size);
////          }
////          for (var i=0;i<ths.length;i++) ths[i].pn.getElementsByTagName('a')[0].removeAttribute('href');
//////          for (var i=0;i<ths.length;i++) ths[i].pn.getElementsByTagName('a')[0].addEventListener('click',this.preventDefault,false); // TEST
////          return ths;
//////          for (var i=mixs.length-1;i>=0;i--) if (mixs[i].tagName==='DIV') mixs[i]={pn:mixs[i]}; // CAN'T WRITE TO COLLECTION.
//////                                             else Array.prototype.splice.call(mixs,i,1);
//////          return mixs; // return collection
////        },
//        no : function(th){return th.pn.getElementsByTagName('img')[0].id.replace(/img\-/,'');},
        no : function(th){return parseInt(th.pn.getAttribute('data-id'),10);},
        sticky: function(th){return th.pn.getAttribute('data-sticky')==='true';},
        proto: 'vichan.catalog_html'
      },
      'catalog_json' : {
////        op_img_url: function(obj) { // working code.
////          return (obj.ext==='.jpg' || obj.ext==='.png' || obj.ext==='.jpeg' || obj.ext==='.gif' || obj.ext==='.webm' || obj.ext==='.mp4')?
////                   'https://' + site2['8chan'].domain_url + obj.board + 'thumb/' + obj.tim + '.jpg' :
////                 (obj.embed)? 'https:' + obj.embed.replace(/.*src="/,'').replace(/".*/,'') :
////                 (obj.ext==undefined)? 'https://' + site2['8chan'].domain_url + '/static/no-file.png' :
//////                 (obj.ext==undefined)? 'https://' + site2['8chan'].domain_url + '/static/assets' + obj.board + 'no-file.png' :
////                 '';
//////          return ((obj.ext==='.jpg' || obj.ext==='.jpeg' || obj.ext==='.gif' || obj.ext==='.png')? 'https://' + site2['8chan'].domain_url + obj.board + 'thumb/' + obj.tim + obj.ext : '');
////        },
        proto: 'vichan.catalog_json'
      },
      'page_html'    : {
        ths: function(doc) {
//          var pc = doc.pn.getElementsByName('postcontrols')[0].childNodes;
//          var ths = [];
//          if (pc) for (var i=0;i<pc.length;i++) if (pc[i].id && pc[i].id.substr(0,6)=='thread') ths[ths.length] = pc[i];
//          ths = this.ths_array(doc,ths);
          var ths = this.ths_array(doc,doc.pn.getElementsByClassName('thread')); // 2015.04.26 changed to the same as 4chan.
          if (site.whereami!=='page' || !pref.catalog.embed_page) for (var i=0;i<ths.length;i++) ths[i].pn.removeAttribute('class');
//          for (var i=0;i<ths.length;i++) if (ths[i].pn.nextSibling && ths[i].pn.nextSibling.tagName==='HR') ths[i].pn.appendChild(ths[i].pn.nextSibling);
////          for (var i=0;i<ths.length;i++) {
////            var as = ths[i].pn.getElementsByTagName('a');
////            as[0].removeAttribute('href'); // changed 2015.04.26
////            as[1].removeAttribute('href'); // changed 2015.04.26
////          }
          return ths;
        },
//        no : function(th){return parseInt(th.pn.getElementsByClassName('post op')[0].id.substring(3),10);},
        proto: 'vichan.page_html'
      },
      'page_json'  : {
        has_posts: true,
        proto: 'catalog_json'
      },
      'thread_html'  : {
////        qsel_th2posts: ':scope>.post.reply', // working code.
////        pop_post_prep: function(th){
////          th.posts_col = th.pn.querySelectorAll(this.qsel_th2posts);
////          th.idx_pop = th.posts_col.length-1;
////        },
////        pop_post: function(th){
////          while (th.idx_pop>=0) {
////            var pn = th.posts_col[th.idx_pop--];
////            if (pn.className && pn.className.indexOf('post')!=-1 && pn.className.indexOf('reply')!=-1) {
////              th.post = {pn:pn, parse_funcs:this, __proto__:th.__proto__};
////              return true;
////            }
////          }
////          return false;
////        },
        proto: 'vichan.thread_html'
      },
      'thread_json'  : {
        proto: 'vichan.thread_json'
      },
    },

    popups_op_func_set: function(pn){return pn.parentNode.querySelector('.files');},
    popups_op_func_use: function(pn,thq,no){
      pn.setAttribute('class',pn.getAttribute('class')+' reply');
      pn.insertBefore(thq[no].isOP.cloneNode(true),pn.firstChild);
    },
    update_posts_remove: function(th_old,i,pnode){
      pnode.removeChild(th_old.posts[i].pn.nextSibling);
      pnode.removeChild(th_old.posts[i].pn);
    },
    update_posts_insert: function(th,th_old,i,pnode){
      var ref = (i==1)? (th_old.posts[0].pn.nextSibling || null) :
                        (th_old.posts[th_old.posts.length-1].pn.nextSibling && th_old.posts[th_old.posts.length-1].pn.nextSibling.nextSibling || null);
      if (!th.posts[i].pn) th.posts[i].pn = this.post_json2html(th.posts[i],th.board);
      pnode.insertBefore(th.posts[i].pn, ref);
      pnode.insertBefore(document.createElement('br'),ref);
    },

    catalog_json2html3_thumbnail: function(obj, board) {
      return (obj.ext==='.jpg' || obj.ext==='.png' || obj.ext==='.jpeg' || obj.ext==='.gif' || obj.ext==='.webm' || obj.ext==='.mp4')?
               'https://' + site2['8chan'].domain_url + board + 'thumb/' + obj.tim + '.jpg' :
             (obj.embed)? 'https:' + obj.embed.replace(/.*src="/,'').replace(/".*/,'') :
             (obj.ext===undefined)? 'https://' + site2['8chan'].domain_url + '/static/no-file.png' :
//             (obj.ext===undefined)? 'https://' + site2['8chan'].domain_url + '/static/assets' + board + 'no-file.png' :
             '';
//      return ((obj.ext==='.jpg' || obj.ext==='.jpeg' || obj.ext==='.gif' || obj.ext==='.png')? 'https://' + site2['8chan'].domain_url + board + 'thumb/' + obj.tim + obj.ext : '');
    },
    proto : 'vichan'
  };
  site2['8chan_live'] = {
    parse_funcs : {
      'thread_html'  : {
        posts: function(th){return this.posts_array(th, th.pn.querySelectorAll(':scope>.post.reply'));},
        proto: '8chan.thread_html'
      }
    },
    proto : '8chan'
  };
  site2['vichan'] = {
    components: {
      boardlist: '.boardlist'
    },
    postform_prep: function(){
      site.postform_submit = site.postform.querySelector('input[name=post]');
      site.postform_submit2 = null;
      site.postform_submit2_observer = new MutationObserver(this.postform_submit2_find);
      site.postform_submit2_observer.observe(document.getElementsByTagName('body')[0], {childList: true});
    },
    postform_submit2_find: function(){
      var postform_qr = document.querySelectorAll('input[name=post]')[1]; // quick reply
      if (!site.postform_submit2 && postform_qr) {
        site.postform_submit2 = postform_qr;
//        site.postform_submit2_observer.disconnect();
//        delete site.postform_submit2_observer;
        if (common_obj.thread_reader) common_obj.thread_reader.add_event_to_submit(site.postform_submit2);
      } else if (site.postform_submit2 && !postform_qr) {
        if (common_obj.thread_reader) common_obj.thread_reader.remove_event_from_submit(site.postform_submit2);
        site.postform_submit2 = null;
      }
    },
    set_max_page: function(){
      var pn = document.getElementsByClassName('pages')[0];
      var max = 0;
      for (var i=0;i<pn.childNodes.length;i++) if (pn.childNodes[i].getAttribute && pn.childNodes[i].getAttribute('href')) max++;
      return max;
    },
    boards_sel_from_tags : function(){
      var boards = document.getElementsByClassName('modlog')[0].getElementsByTagName('tbody')[0];
      var str = 'SELECTED_BOARDS,';
      for (var i=0;i<boards.childNodes.length;i++)
        if (boards.childNodes[i].style.display!=='none') str = str + '8chan' + boards.childNodes[i].getElementsByClassName('uri')[0].getElementsByTagName('a')[0].textContent + ',';
      return str;
    },
//    catalog_background : '#eef2ff',
//    catalog_bordercolor : '#d6daf0',
    get_time_of_posts : function(doc){
      var posts = doc.getElementsByClassName('post');
      return [Date.parse(posts[posts.length-1].getElementsByTagName('time')[0].getAttribute('datetime')),
              Date.parse(posts[0             ].getElementsByTagName('time')[0].getAttribute('datetime'))];
    },
    get_thread_link : function(pn,bn,del,name){
      var as = pn.getElementsByClassName('post op')[0].getElementsByTagName('a');
      var hrefs = [];
      var href;
      for (var i=as.length-1;i>=0;i--) if (as[i].innerHTML==='[Reply]' || as[i].innerHTML==='[Last 50 Posts]') {
        var href = as[i].getAttribute('href');
        if (hrefs.length==0 || as[i].innerHTML==='[Reply]') hrefs.unshift(href);
        else hrefs.push(href);
        if (del) as[i].parentNode.removeChild(as[i]);
        else {
//          as[i].setAttribute('target',(pref.catalog_open_in_new_tab)? '_blank' : '_self');
//          as[i].setAttribute('onclick','open_new_thread('+as[i].getAttribute('href')+','+name+')');
          as[i].addEventListener('click', function(){open_new_thread(as[i].getAttribute('href'),name);}, false);
//          as[i].removeAttribute('href');
        }
      }
      return (hrefs.length!=0)? hrefs : null;
    },
    modify_thread_link : function(pn){
      var as = pn.getElementsByClassName('post op');
      if (as.length==0) return [];
      var retval = [];
      as = as[0].getElementsByTagName('a');
      for (var i=as.length-1;i>=0;i--) 
        if (as[i].innerHTML=='[Reply]' || as[i].innerHTML=='[Last 50 Posts]') {
          var href = as[i].getAttribute('href');
          if (href) {
            retval.push([as[i],href]);
//            as[i].addEventListener('click', make_open_new_thread_callback(href,name), false);
//            as[i].addEventListener('click', function(){open_new_thread(href,name);}, false);
            as[i].removeAttribute('href');
          }
        }
      return retval;
    },
//    add_thread_link : function(doc,url){
//      var pn = document.createElement('a');
//      pn.href = url.replace(new RegExp('/https*:\/\/'+site2['8chan'].domain_url+'/'),'');
//      pn.innerHTML = '[Reply]';
//      var th = doc.getElementsByClassName('post op')[0];
//      if (th) th.insertBefore(pn,th.firstChild);
//    },
    catalog_threads_in_page : function(doc){ // patch
      var doc_obj = {domain:site.nickname, pn:doc};
      var ths = this.parse_funcs['page_html'].ths(doc_obj);
      for (var i=0;i<ths.length;i++) ths[i] = ths[i].pn;
      return ths;
    },
//    catalog_threads_in_page : function(doc){return this.parse_funcs['page_html'].ths(doc);},
//    catalog_threads_in_page : function(doc){
//      var pc = doc.getElementsByName('postcontrols');
//      th = [];
//      if (pc.length!=0)
//        for (var i=0;i<pc[0].childNodes.length;i++)
//          if (pc[0].childNodes[i].id && pc[0].childNodes[i].id.substr(0,6)=='thread') th.push(pc[0].childNodes[i]);
//      return th;
//    },
    remove_posts : function(th,end){
      site2.common.remove_by_classname(th,'post reply',end,true);
//      site2.common.remove_double_br(th);
    },
    remove_files_info : function(th){
      site2.common.remove_by_classname(th,'fileinfo');
      site2.common.move_up_and_delete_parent(th.getElementsByClassName('post-image'));
    },
//    site.catalog_files_info = function(doc){return doc.getElementsByClassName('fileinfo');};
//    site.catalog_delete_checkboxs = function(doc){return doc.getElementsByClassName('delete');};
//    remove_checkboxes : function(doc){
//      var cbxs = doc.getElementsByClassName('delete');
//      for (var i=cbxs.length-1;i>=0;i--) cbxs[i].outerHTML = '';
//      return doc;
//    },
    postform_rules : null,
    thread_keyword : 'res',
    max_page : function(){return 15;},
    make_url4 : function(dbt){
      var url_prefix = this.protocol + '//' + this.domain_url + dbt[1];
      if      (dbt[3]==='page_html')    return [url_prefix + ((dbt[2]!=0)? (parseInt(dbt[2],10)+1) :'index')+'.html', 'html'];
      else if (dbt[3]==='catalog_json') return [url_prefix + 'catalog.json', 'json'];  // Doesn't contain information about webm thumbnail.
      else if (dbt[3]==='catalog_html') return [url_prefix + 'catalog.html', 'html'];
      else if (dbt[3]==='thread_html')  return [url_prefix + 'res/' + dbt[2] + '.html', 'html'];
      else if (dbt[3]==='thread_json')  return [url_prefix + 'res/' + dbt[2] + '.json', 'json'];
    },
////////    make_url : function(board,no,key){ // working code.
////////      var url_prefix = site2['8chan'].protocol + '//' + site2['8chan'].domain_url + board;
////////      if (key==='p') return [url_prefix + ((no!=0)? (no+1) :'index')+'.html', 'html'];
////////      else if (key==='j') return [url_prefix + 'catalog.json', 'json'];  // Doesn't contain information about webm thumbnail.
////////      else return [url_prefix + 'catalog.html', 'html'];
////////    },
//////////    make_url3: function(board,th){return site2['8chan'].protocol + '//' + site2['8chan'].domain_url + board + 'res/' + th + '.html';},
////////    make_url3: function(board,th){return site2['8chan'].protocol + '//' + site2['8chan'].domain_url + board + 'res/' + ((th[0]!=='t')? (th + '.html') : (th.substr(1) + '.json'));},
//////////    make_url3: function(board,th){
//////////      return [site2['8chan'].protocol + '//' + site2['8chan'].domain_url + board + 'res/' + ((th[0]!=='t')? (th + '.html') : (th.substr(1) + '.json')), (th[0]!=='t')? 'html' : 'json'];
//////////    },
    url_boards_json : function(){return [site2['8chan'].protocol + '//' + site2['8chan'].domain_url + '/boards.json','json'];},
//    enumerate_boards_to_scan:function(){
//      var obj = [];
//      var end = (site3[site.nickname].boards.length > pref.scan.max)? pref.scan.max : site3[site.nickname].boards.length;
//      for (var i=0;i<end;i++) 
//        if (site3[site.nickname].boards[i].max) obj[obj.length] = '/'+site3[site.nickname].boards[i].uri+'/';
//      return obj;
//    },
    get_ops : function(doc){
      var op_containers = doc.getElementsByClassName('post op');
      var ops = [];
//      for (var i=0;i<op_containers.length;i++) ops.push(op_containers[i].getElementsByTagName('input')[0].id.substring(7));
      for (var i=0;i<op_containers.length;i++) ops.push(parseInt(op_containers[i].id.substring(3),10));
      return ops;
    },
    get_posts : function(doc) {
      var posts = [];
//      var deletes = doc.getElementsByClassName('delete');
//      for (var i=0;i<deletes.length;i++) posts.push(deletes[i].id.substr(7));
      var nos = doc.getElementsByClassName('post_no');
      for (var i=0;i<nos.length;i++) if (nos[i].id) posts.push(parseInt(nos[i].id.substr(8),10));
      return posts;
    },
//    absolute_link : function(doc){
//      var all = doc.getElementsByTagName('*');
//      var tgts = ['src','href'];
//      for (var i=0;i<all.length;i++) {
//        for (var j=0;j<tgts.length;j++) {
//          var tgt = all[i].getAttribute(tgts[j]);
//          if (tgt && tgt.indexOf('http')!=0  && tgt.substr(0,2)!='//')  all[i].setAttribute(tgts[j],site2['8chan'].protocol + '//' + site2['8chan'].domain_url + tgt);
//        }
//      }
//    },
//    absolute_link : function(doc){
//      var all = doc.getElementsByTagName('*');
//      for (var i=0;i<all.length;i++) {
//        if (all[i].getAttribute('src')  && all[i].getAttribute('src').indexOf('http')!=0  && all[i].getAttribute('src').substr(0,2)!='//')  all[i].setAttribute('src',site2['8chan'].protocol + '//' + site2['8chan'].domain_url + all[i].getAttribute('src'));
//        if (all[i].getAttribute('href') && all[i].getAttribute('href').indexOf('http')!=0 && all[i].getAttribute('href').substr(0,2)!='//') all[i].setAttribute('href',site2['8chan'].protocol + '//' + site2['8chan'].domain_url + all[i].getAttribute('href'));
//      }
//    },
////////    insert_footer : function(th,page_no,bn,exe,date,nof_posts,nof_files){
////////      var key = (!brwsr.ff)? 'innerText' : 'innerHTML';
////////      nof_posts += th.getElementsByClassName('post').length;
////////      nof_files += th.getElementsByClassName('fileinfo').length;
////////      var om_info = th.getElementsByClassName('omitted');
////////      if (om_info[0]) {
////////        var str = om_info[0][key].replace(/\n/g,'');
////////        nof_posts += parseInt(str.replace(/\ post.*/,''),10);
////////        nof_files += parseInt('0'+str.replace(/\ image.*/,'').replace(/[^\ ]*\ /g,''),10);
////////      }
////////      if (exe) {
////////        var pn = document.createElement('div');
////////        pn.setAttribute('name','catalog_footer');
////////        if (pref.catalog_footer_br) pn.setAttribute('style','clear:both');
////////        pn.innerHTML = '<span>' + bn + '  ' + nof_posts + '/' + nof_files + '/' + page_no + '  </span>';
//////////        pn.innerHTML = '<span><span>' + bn + '  </span><span></span><span>' + nof_posts + '/' + nof_files + '/' + page_no + '  </span></span>';
////////        var flags = th.getElementsByClassName('flag');
////////        for (var i=0;i<flags.length;i++) {
////////          pn.appendChild(flags[i].cloneNode(false));
//////////          pn.appendChild(document.createTextNode(' '));
////////        }
////////        th.insertBefore(pn,th.getElementsByClassName('post op')[0]);
////////      }
////////      return [nof_posts,nof_files];
////////    },
////////    insert_footer2 : function(th,type,nums,nums2){
////////      var str_add = ((pref.catalog_footer_show_nof_rep_to_me)? nums[1]+'/' : '' ) +(nums2[2]-nums[2]);
////////      if (type==='page') {
////////        var footer = th.getElementsByTagName('div')['catalog_footer'];
//////////        footer.childNodes[0].childNodes[1].innerHTML = nums[1] + '/' + (nums2[2]-nums[2]) + '/';
//////////        footer.childNodes[0].innerHTML = footer.childNodes[0].innerHTML.replace(/  /,'  '+ nums[1] + '/' + (nums2[2]-nums[2]) + '/');
////////        var str = footer.childNodes[0].innerHTML;
////////        var fields = str.replace(/[^ ]*  /,'').split('/');
////////        if (fields.length>3) fields.splice(0,fields.length-3);
////////        footer.childNodes[0].innerHTML = str.replace(/  .*/,'  ') + ((nums[0]>=0)? str_add + '/' :'') + fields.join('/');
////////      } else {
////////        var footer = th.getElementsByTagName('strong')[0];
////////        footer.childNodes[0].innerHTML = (nums[0]>=0)? 'U: '+ str_add + ' / ' : '';
////////      } 
////////    },
//    prep_footer3 : function(footer,board){
////      th.footer.setAttribute('name',pref.script_prefix+'_footer');
//      if (pref.catalog_footer_show_board_name) {
////        footer.innerHTML = '<span name="'+pref.script_prefix+'_footer">' + footer.innerHTML +'</span>' + '&emsp;' + board;
//        footer.innerHTML = '<span>' + footer.innerHTML + '</span>' + '&emsp;' + board;
//        footer = footer.childNodes[0];
//      }
//      return footer;
//    },
//    insert_footer3 : function(footer,nums,nums2){
//      var str_add = ((pref.catalog_footer_show_nof_rep_to_me)? nums[1]+'/' : '' ) +(nums2[2]-nums[2]);
//      var str = (pref.catalog_footer_design==='native')? ((nums[0]>=0)? 'U: '+ str_add + ' / ' : '') + 'R: '+(nums2[2]-1) + ' / I: '+nums2[3]
//                                                       : ((nums[0]>=0)? str_add + '/' : '') + nums2[2] + '/'+nums2[3]; // trial.
//      footer.innerHTML = str;
//    },
////////    check_reply_to_me : function(name,dbt,nums,value,date,pool){
////////      var obj ;
////////      var time_check = (nums[6]==nums[0])? nums[3] : nums[0];
////////      if (dbt[2][0]==='t') {
////////        obj = ('response' in value)? value.response.posts : JSON.parse(value.responseText).posts;
////////        var images = 0;
////////        for (var i=0;i<obj.length;i++) {
////////          if ('filename' in obj[i]) images++;
////////          if (obj[i].extra_files) for (var j=0;j<obj[i].extra_files.length;j++) if ('filename' in obj[i].extra_files[j]) images++;
////////          obj[i].time *= 1000;
//////////obj[i].time += - pref.localtime_offset*3600000; // BUG PATCH.
////////          if (obj[i].ext==='.jpeg' || obj[i].ext==='.gif') obj[i].ext = '.jpg';
////////          if (obj[i].filename) obj[i].icon =  'https://' + site2['8chan'].domain_url + dbt[1] + 'thumb/' + obj[i].tim + obj[i].ext;
////////        }
////////        obj[0].images = images;
//////////        if (obj[obj.length-1].ext==='.jpeg' || obj[obj.length-1].ext==='.gif') obj[obj.length-1].ext = '.jpg';
//////////        if (obj[obj.length-1].filename) obj[obj.length-1].icon =  'https://' + site2['8chan'].domain_url + dbt[1] + 'thumb/' + obj[obj.length-1].tim + obj[obj.length-1].ext;
////////        pool.sticky = obj[0].sticky;
////////      } else obj = site2['8chan'].get_posts2(value,pool,time_check);
//////////      date = [obj[obj.length-1].time, date[1], obj.length, obj[0].images];
//////////      date[0] = obj[obj.length-1].time; // CAUSE BUG IN PAGE, THIS PREVENT REVISING POST'S INFO FOR POPUPS. AND MUST BE FIXED TIMEZONE MISUNDERSTOOD.
//////////if (date[4] != obj[obj.length-1].time) console.log('find: '+name+', '+date[4]+' -> '+obj[obj.length-1].time+', '+(obj[obj.length-1].time-date[4]));
////////      date[4] = obj[obj.length-1].time;
//////////                            IF UNCOMMENT, CAUSE BLINKS BECAUSE USING DIFFERENT METHOD TO EVALUATE,
//////////                            IF COMMENT, DELAYS UPDATE AND CAUSE BUG IN PAGE MODE.
//////////      date[2] = obj.length; // CAUSE BUG IN PAGE, THIS CAUSE INCONSISTENCY BETWEEN FOOTER AND POPUP COMMENTS.
//////////      date[3] = obj[0].images; // CAUSE BUG IN PAGE, THIS CAUSE INCONSISTENCY BETWEEN FOOTER AND POPUP COMMENTS.
////////
//////////      var i = 0;
//////////      while (i<obj.length && (!obj[i] || obj[i].time<=time_check)) i++;
////////      var i = obj.length;
////////      while (i-1>=0 && obj[i-1] && obj[i-1].time>time_check) i--;
//////////console.log(name+', '+obj.length+', '+(obj.length-i));
//////////      nums[2] = i;
////////      var rep_to_me = (nums[6]==nums[0])? nums[1] : 0;
////////      var rep       = (nums[6]==nums[0])? nums[7] : 0;
////////      nums[4] = [];
////////      if (nums[3]<nums[0]) nums[3]=nums[0];
////////      if (i<obj.length ) {
////////        while (i<obj.length) {
////////          if (pref.catalog_footer_ignore_my_own_posts && (dbt[1]+obj[i].no in site3['8chan'].own_posts)) {i++;continue;}
////////          rep++;
//////////          if (obj[i].time>nums[3]) nums[4].push({icon:obj[obj.length-1].icon, body:obj[obj.length-1].com, time:obj[obj.length-1].time, to_me:false});
////////          if (obj[i].time>nums[3]) nums[4].push({icon:obj[i].icon, body:obj[i].com, time:obj[i].time, to_me:false});
////////          var tgts = [];
////////          if (obj[i].com) {
////////            var anchors = obj[i].com.match(/&gt;&gt;[0-9]+/g);
////////            if (anchors) for (var j=0;j<anchors.length;j++) tgts.push(dbt[1]+anchors[j].substr(8));
////////            anchors = obj[i].com.match(/&gt;&gt;&gt;\/[0-9A-z_\+]+\/[0-9]+/g);
////////            if (anchors) for (var j=0;j<anchors.length;j++) tgts.push(anchors[j].substr(12));
//////////console.log(tgts);
////////            for (var j=0;j<tgts.length;j++) {
////////              if (site3['8chan'].own_posts[tgts[j]]===null) {
////////                rep_to_me++;
////////                if (obj[i].time>nums[3]) nums[4][nums[4].length-1].to_me = true;
//////////console.log(dbt[2]+', >>'+tgts[j]);
////////                break;
////////          }}}
//////////          var anchors = (obj[i].com)? obj[i].com.match(/&gt;&gt;[0-9]+/g) : null; // working code.
//////////          if (anchors) {
//////////            for (var j=0;j<anchors.length;j++) {
//////////              var tgt = anchors[j].substr(8);
//////////              if (site3['8chan'].own_posts[dbt[1]+tgt]===null) {
//////////                rep_to_me++;
//////////                if (obj[i].time>nums[3]) nums[4][nums[4].length-1].to_me = true;
////////////console.log(dbt[2]+', >>'+tgt);
//////////                break;
//////////          }}}
//////////          anchors = (obj[i].com)? obj[i].com.match(/&gt;&gt;&gt;\/[0-9A-z_\+]+\/[0-9]+/g) : null;
//////////          if (anchors) {
//////////            for (var j=0;j<anchors.length;j++) {
//////////              var tgt = anchors[j].substr(12);
//////////              if (site3['8chan'].own_posts[tgt]===null) {
//////////                rep_to_me++;
//////////                if (obj[i].time>nums[3]) nums[4][nums[4].length-1].to_me = true;
//////////                break;
//////////          }}} 
////////          i++;
////////        }
////////      }
////////      nums[2] = obj.length - rep;
////////      nums[1] = rep_to_me;
////////      nums[3] = obj[obj.length-1].time;
////////      nums[6] = nums[0];
////////      nums[7] = rep;
////////    },
////////    get_posts2 : function(doc,pool,time_check) {
////////      var obj = [];
////////      var posts = doc.getElementsByClassName('post');
//////////      for (var i=0;i<posts.length;i++) {
////////      var i=posts.length-1;
////////      while (i>=0) {
////////        var image = posts[i].getElementsByClassName('post-image');
////////        image = (image[0])? image[0].getAttribute('src') : undefined;
////////        var time = Date.parse(posts[i].getElementsByTagName('time')[0].getAttribute('datetime'));
////////        obj[i] = {
////////          time: time,
////////          com:  posts[i].getElementsByClassName('body')[0].innerHTML,
////////          no:   parseInt(posts[i].getElementsByClassName('post_no')[0].id.substr(8),10),
////////          icon: image
////////        }
////////        if (time<=time_check && i!=0) i=0;
////////        else i--;
////////      }
//////////      var image = posts[posts.length-1].getElementsByClassName('post-image');
//////////      obj[obj.length-1].icon = (image[0])? image[0].src : undefined;
////////      var files = doc.getElementsByClassName('thread')[0].getElementsByClassName('file');
//////////      for (var i=files.length-1;i>=0;i--) if (files[i].tagName!=='DIV') files[i].remove(); // slow?
////////      var nof_files = 0;
////////      for (var i=files.length-1;i>=0;i--) if (files[i].tagName==='DIV') nof_files++;
////////      var op_images = doc.getElementsByClassName('thread')[0].getElementsByClassName('files');
////////      op_images = (!op_images[0])? 0 : op_images[0].getElementsByClassName('file').length;
//////////      obj[0].images = files.length - op_images;
////////      obj[0].images = nof_files - op_images;
////////      pool.sticky = doc.getElementsByClassName('fa-thumb-tack').length!=0
////////      return obj;
////////    },
    get_post_offsetTop : function(doc,num) {
      return doc.getElementsByClassName('post')[num].offsetTop;
    },
    add_sticky_info : function(th,type){
      if (type==='catalog_html') {
        var parent = th.getElementsByClassName('thread')[0];
        if (parent) {
          var icon = document.createElement('i');
          icon.setAttribute('class','fa fa-thumb-tack');
          icon.setAttribute('style','position:absolute;left:0px');
          parent.insertBefore(icon,parent.childNodes[0]);
        }
        return icon;
      } else return null;
    },
    favicon: {
      get_favicon: function(){
        var links = document.getElementsByTagName('head')[0].getElementsByTagName('link');
        for (var i=0;i<links.length;i++) if (links[i].getAttribute('rel')=='shortcut icon') return links[i];
        var pn = document.createElement('link');
        pn.setAttribute('rel','shortcut icon');
        pn.setAttribute('href',this.none);
        pn.setAttribute('type','image/x-icon');
        return document.getElementsByTagName('head')[0].appendChild(pn);
      },
      get_title: function(){
        var title = document.getElementsByTagName('head')[0].getElementsByTagName('title')[0];
        if (!title){
          title = document.createElement('title');
          title = document.getElementsByTagName('head')[0].appendChild(title);
        }
        return title;
      },
      none: '/favicon.ico',
      reply: 'png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAQElEQVR42mNgGEbg/5n/GJgYORQFDQ0IjK4BmxxWzehsQnJYBdFtxCWH1QBcrkKWw2sAWS6gKAwojgWqpIORDQBVkjfW5KYpFQAAAABJRU5ErkJggg==',
      reply_to_me: 'png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAWUlEQVR42mNgAIH/Z/4zNDRgYpA4UQBqADIYZAaAaHRMtAEwjB42cEPQFaCzCclhFcQWK9jk0A1A8QJW2xgYiDeAJBdQFAbYAhLdRryxgByVuOKaYDoY2QAAcHCIXLRHYMUAAAAASUVORK5CYII='
    },
//    get_op_image_url: function(th,type){
//      var img = th.getElementsByTagName('img')[0];
//      return (img)? img.src : undefined; // patch.
//    },
    time_revised_check: function(nof_ths){return nof_ths>300;},
    format_thread_layout : function(th){
      site2.common.add_attribute_by_tagname(th,'img','style','margin:0px');
      site2.common.add_attribute_by_tagname(th,'iframe','style','margin:0px');
      site2.common.add_attribute_by_classname(th,'post','style','padding:0px');
      site2.common.add_attribute_by_classname(th,'intro','style','margin:0px');
      site2.common.add_attribute_by_classname(th,'body','style','margin:12px 5px');
    },
    format_thread_contents : function(th){
      site2.common.remove_by_classname(th,'delete');
//      site2.common.remove_by_tagname(th,'hr');
//      site2.common.remove_by_tagname(th,'br');
      site2.common.remove_by_classname(th,'omitted');
    },
    format_time : function(th){
      var times = th.getElementsByTagName('time');
      for (var i=0;i<times.length;i++) times[i][brwsr.innerText] = site2.common.change_utc_to_local(times[i].getAttribute('datetime'));
    },
    format_remove_tn_area_size: function(th){
      var files = th.getElementsByClassName('file');
      for (var i=0;i<files.length;i++){
        var file_style = files[i].getAttribute('style');
        if (file_style) {
          file_style = ((file_style)? file_style + ';' : '') + 'float:left;';
          if (file_style.indexOf('width')!=-1) file_style = file_style.replace(/width:[^;]*(;|$)/,'');
          if (file_style.indexOf('height')!=-1) file_style = file_style.replace(/height:[^;]*(;|$)/,'');
          files[i].setAttribute('style',file_style);
        }
      }
    },
    get_time_of_post_in_utc : function(post){
      return Date.parse(post.getElementsByTagName('time')[0].getAttribute('datetime'));
    },
    mark_newer_posts: function(th,date,unmark) {
//      return site2.common.mark_newer_posts('8chan',th.getElementsByClassName('post'),date,'border:2px solid red','border: none','class','post');
      return site2['DEFAULT'].mark_newer_posts('8chan',th.getElementsByClassName('post'),date,'border:2px solid red','border: none',null,null,unmark);
    },
//    unmark_post_from_event: function() {
//      this.setAttribute('style','border: none');
//      this.removeEventListener('mouseover', site2['8chan'].unmark_post_from_event, false);
//    },
//    mark_newer_posts : function(th,date){
//      var marked_first_post = null;
////      var offset_top = 0;
//      var times = th.getElementsByTagName('time');
//      for (var i=times.length-1;i>=0;i--) {
//        var mark = date<Date.parse(times[i].getAttribute('datetime'))-pref.localtime_offset*3600000;
//        var reply = times[i].parentNode;
//        while (reply.className.search(/post/)==-1) reply = reply.parentNode;
//        if (mark) {
//          reply.setAttribute('style','border: 2px solid red');
//          marked_first_post = reply;
////          offset_top = reply.offsetTop;
//        } else reply.setAttribute('style','border: none');
//      }
////      return offset_top;
//      return marked_first_post;
//    },
    get_owners_recommendation: function(){
      var blotter = document.getElementsByClassName('blotter')[0];
      if (blotter) {
        or_str = document.getElementsByClassName('blotter')[0][brwsr.innerText];
        var kwd = 'Recommendation: ';
        var idx = or_str.indexOf(kwd);
        if (idx!=-1) return or_str.substr(idx+kwd.length);
      }
      return '';
    },
////////    thread2headline : function(doc){
////////      return site2.common.thread2headline(doc,'8chan');
////////    },
//    get_json_url_thread: function(board,thread){
//      return site2['8chan'].protocol + '//8chan.co' + board +'res/' + thread + '.json';
//    },
    get_json_url_catalog: function(board){
      return site2['8chan'].protocol + '//' + site2['8chan'].domain_url + board +'catalog.json';
    },
    thread2search_obj: function(th){
      var coms  = aggregate_info(th.getElementsByClassName('body'));
      var subs  = aggregate_info(th.getElementsByClassName('subject'));
      var names = aggregate_info(th.getElementsByClassName('name'));

      var files = th.getElementsByClassName('files');
      var filenames = ['',''];
      if (files.length!=0) {
        for (var i=0;i<files.length;i++) {
          var files_in_post = files[i].getElementsByClassName('unimportant');
          filenames[i] = '';
          for (var j=0;j<files_in_post.length;j++) {
            if (files_in_post[j].getElementsByTagName('a').length!=0) filenames[i] = filenames[i] + files_in_post[j].getElementsByTagName('a')[0][brwsr.innerText] + '\n';
            if (files_in_post[j].getElementsByTagName('span').length!=0) filenames[i] = filenames[i] + files_in_post[j].getElementsByTagName('span')[0][brwsr.innerText] + '\n';
          }
        }
        for (var i=2;i<filenames.length;i++) filenames[1] = filenames[1] + filenames[i] + '\n';
        if (files[0].parentNode!=th) {
          filenames[1] = filenames[0] + '\n' + filenames[1];
          filenames[0] = '';
        }
      }
      return [coms[0], subs[0], names[0], filenames[0], coms[1], subs[1], names[1], filenames[1]];

      function aggregate_info(pns){
        if (pns.length!=0) {
          var parent = pns[0].parentNode;
          while (parent.classList.contains('post')) parent = parent.parentNode;
          var op_idx = (!parent.classList.contains('op'))? 0 : -1;
          var op = (op_idx>=0)? pns[0][brwsr.innerText] : '';
          var posts = '';
          for (var i=op_idx+1;i<pns.length;i++) posts = posts + pns[i][brwsr.innerText] + '\n';
          return [op, posts];
        } return ['',''];
      }
    },
    parse_json_thread: function(txt,from_http){
      var obj = {posts: []};
      var uids = {};
      var nof_uids = 0;
      var posts = document.getElementsByClassName('post');
      for (var i=0;i<posts.length;i++) {
        obj.posts[i] = {};
        obj.posts[i].no = posts[i].id.replace(/op_/,'').replace(/reply_/,'');
        var id = posts[i].getElementsByClassName('poster_id')[0].textContent;
        obj.posts[i].id = id;
        if (uids[id]===undefined) {
          nof_uids++;
          uids[id] = 1;
        }
        obj.posts[i].unique_ips = nof_uids;
      }
      return obj;
    },
    uip_check: function(callback){
      callback(0,200,'');
    },
    uip_tgt_post : function(no){
      var pn = document.getElementById('reply_'+no);
      if (pn) return pn;
      else return document.getElementById('op_'+no);
    },
    uip_post_num : function(tgt_post){
      return tgt_post.getElementsByClassName('intro');
    },
//    catalog_native_prep0: function(threads,callback,pn_filter,pn_tb,func_sel){
////      var node_ref = document.getElementsByClassName('catalog_search')[0].nextSibling;  // FF doesn't work.
//      var node_ref = document.getElementsByClassName('threads')[0];
//      node_ref.parentNode.insertBefore(pn_tb,node_ref);
//      node_ref.parentNode.insertBefore(pn_filter,node_ref);
//
//      site2['8chan'].catalog_from_native(Date.now(),document,threads,null);
//
//      document.getElementById('sort_by').addEventListener('change',func_event,false);
//      return function(){document.getElementById('sort_by').removeEventListener('change',func_event,false);};
//      function func_event(){
//        pref.catalog.indexing = document.getElementById('sort_by').selectedIndex;
//        func_sel();
//      }
//
////      var mixs = document.getElementsByClassName('mix');
////      var date_load = Date.now();
////      for (var i=0;i<mixs.length;i++) site2['8chan'].catalog_from_native_1(threads,mixs[i],date_load);
////      for (var i=0;i<mixs.length;i++) {
////        var url  = mixs[i].getElementsByTagName('a')[0].href;
////        mixs[i].getElementsByTagName('a')[0].removeAttribute('href');
////        var name = url.replace(/.*8chan\.co/,'8chan').replace(/res\//,'').replace(/\.html/,'');
////        var date = [0,0,0,0];
////        var date_load = 0;
////        var page_no = 0;
////        threads[name] = [mixs[i], false, null,
////                         [mixs[i].innerHTML, '8chan'],
////                         mixs[i][brwsr.innerText], null, null, url, date, true,
////                         null,
////                         null, null, date_load, page_no, 0];
////      }
////      http_req.get('catalog',site.nickname+site.board,site.protocol+'//8chan.co'+site.board+'catalog.json',site2['8chan'].catalog_from_json,false,false,[threads,callback,null,site.board]);
//    },
    catalog_native_prep: function(date,pn_filter,pn_tb,pn_hi, embed_catalog){
//      var node_ref = document.getElementsByClassName('catalog_search')[0].nextSibling;  // FF doesn't work.
      var node_ref = (site.whereami==='catalog')? document.getElementsByClassName('threads')[0]
                                                : document.getElementsByName('postcontrols')[0];
      site4.tb_prep_for_embed(pn_tb);
      if (site.whereami==='catalog') {
        var selector_native = document.getElementById('sort_by');
        if (selector_native.selectedIndex!=0) {
          selector_native.selectedIndex = 0;
          var evt = document.createEvent('UIEvents');
          evt.initUIEvent('change', false, true, window, 1);
          selector_native.dispatchEvent(evt);
        }
        selector_native.style.display = 'none';
        document.getElementById('image_size').addEventListener('change', site2['8chan'].catalog_native_size_changed, false);
        var pn_tb_new = document.createElement('span');
        while (pn_tb.firstChild) pn_tb_new.appendChild(pn_tb.firstChild);
        pn_tb = pn_tb_new;
        pn_tb.appendChild(pn_tb.removeChild(pn_tb.childNodes[3]).firstChild);
      } else if (site.whereami==='page') {
        var pctrls = document.getElementsByName('postcontrols')[0];
        if (!pref.catalog_expand_with_hr || embed_catalog) {for (var i=pctrls.childNodes.length-1;i>=0;i--) if (pctrls.childNodes[i].tagName==='HR') pctrls.removeChild(pctrls.childNodes[i]);}
        else for (var i=pctrls.childNodes.length-1;i>=0;i--) if (pctrls.childNodes[i].tagName==='HR') pctrls.childNodes[i].setAttribute('class',pref.script_prefix+'_hs');
        pctrls.parentNode.insertBefore(document.createElement('hr'),pctrls.nextSibling);
      }
//      node_ref.parentNode.insertBefore(pn_hi,node_ref);
      node_ref.parentNode.insertBefore(pn_tb,node_ref);
      node_ref.parentNode.insertBefore(pn_filter,node_ref);
      var selector_catchan = pn_filter.getElementsByTagName('select')['catalog.indexing'];
      selector_catchan.childNodes[0].textContent = 'Bump order';
      if (site.whereami==='catalog') selector_native.parentNode.insertBefore(selector_catchan,selector_native);
      else pn_tb.childNodes[3].insertBefore(selector_catchan,pn_tb.childNodes[3].firstChild);
//      pn_tb.childNodes[0].setAttribute('style',pn_tb.childNodes[0].getAttribute('style')+';display:none');
//      pn_tb.childNodes[1].setAttribute('style',pn_tb.childNodes[1].getAttribute('style')+';display:none');
      return site2['8chan'].catalog_from_native(date,document,site.board,site.whereami+'_html');
    },
    catalog_native_size: (document.getElementById('image_size'))? document.getElementById('image_size').value : 'small',
    catalog_native_size_changed: function(){site2['8chan'].catalog_native_size = this.value;},
    catalog_get_native_area: function(){
      if (site.whereami==='catalog') return document.getElementById('Grid');
      return document.getElementsByName('postcontrols')[0];
////      else { // working code.
////        var pc = document.getElementsByName('postcontrols')[0];
////        return pc.insertBefore(document.createElement('div'),pc.firstChild);
////      }
    },
    catalog_from_native : function(date,doc,board,type) {
      var ths;
if (pref.test_mode['0']) {
      ths = {domain:'8chan', board:board, pn:doc};
      this.parse_funcs['catalog_html'].entry(ths,this.parse_funcs['catalog_html']['full_hier']);
      return ths.ths;
} else {
////      var parse_obj = {domain:'8chan', board:board, parse_funcs:site2['8chan'].parse_funcs[type], __proto__:site4.parse_funcs_on_demand};
////      ths = {pn:doc, __proto__:parse_obj};
////      return ths.ths;
      return site2[this.nickname].wrap_to_parse.get(doc, this.nickname, board, type);
}
    },
//    catalog_from_native : function(date,doc,board) {
//      var ths;
//if (pref.test_mode['0']) {
//      ths = {domain:'8chan', board:board, pn:doc};
//      this.parse_funcs['catalog_html'].entry(ths,this.parse_funcs['catalog_html']['full_hier']);
//} else {
////      ths = {domain:'8chan', board:board, pn:doc, parse_funcs:this.parse_funcs['catalog_html'], __proto__:site4.parse_funcs_on_demand};
//      var parse_obj = {domain:'8chan', board:board, parse_funcs:site2['8chan'].parse_funcs['catalog_html'], __proto__:site4.parse_funcs_on_demand};
//      ths = {pn:doc, __proto__:parse_obj};
//}
//      return ths.ths;
//    },
//    catalog_from_native : function(date,doc,board) {
//      var mixs = doc.getElementsByClassName('mix');
//      var ths = [];
////      for (var i=0;i<mixs.length;i++) {
////        ths.push(site2['8chan'].catalog_from_native_1(mixs[i]));
////        if (mixs[i].parentNode) mixs[i].parentNode.removeChild(mixs[i]);
////      }
////var time_in = Date.now();
//      for (var i=0;i<mixs.length;i++) if (mixs[i].tagName==='DIV') ths.push(site2['8chan'].catalog_from_native_1(mixs[i],board));
////console.log('aaa: '+(Date.now()-time_in));
////      for (var i=0;i<ths.length;i++) if (ths[i].pn.parentNode) ths[i].pn.parentNode.removeChild(ths[i].pn);
//      return ths;
//    },
//    catalog_from_native_1 : function(th,board) {
//      th.getElementsByTagName('a')[0].removeAttribute('href');
//      var sub = th.getElementsByClassName('subject');
//      sub = (sub[0])? sub[0].textContent : '';
//      var opn = th.getElementsByTagName('img')[0].getAttribute('data-name');
//      var op = th[brwsr['innerText']].replace(th.getElementsByTagName('strong')[0][brwsr['innerText']],'');
//      if (sub!=='') op = op.replace(sub,'');
////      if (pref.catalog_footer_show_board_name) th.getElementsByTagName('strong')[0].innerHTML = '<span></span>' + th.getElementsByTagName('strong')[0].innerHTML + '&emsp;' + board;
//      return {
//        pn: th,
//        exist: false,
//        no: th.getElementsByTagName('img')[0].id.replace(/img\-/,''),
//        search_obj: [ op, sub, opn, '', '', '', '', ''],
//        page_no: '?',
//        time_bumped: (parseInt(th.getAttribute('data-bump'),10)-pref.localtime_offset*3600)*1000,
//        time_created : (parseInt(th.getAttribute('data-time'),10)-pref.localtime_offset*3600)*1000,
//        nof_posts: parseInt(th.getAttribute('data-reply'),10) +1,
//        nof_files: parseInt(th.getElementsByClassName('replies')[0].getElementsByTagName('strong')[0].textContent.replace(/.*I: */,''),10),
////        init_func: site2['8chan'].catalog_from_native_init_elem_func,
//        update_func: site2['8chan'].catalog_from_native_update_elem_func,
//        board: board,
//        footer: th.getElementsByTagName('strong')[0], // temporal
//        domain: '8chan', // temporal
//        sticky: th.getAttribute('data-sticky')==='true', // temporal
//      }
//    },
//    catalog_from_native_init_elem_func : function(th) {
//      th.setAttribute('class','mix');
//      th.setAttribute('style','display: inline-block;');
//    },
//    catalog_from_native_update_elem_func : function(th,src) {
//      th.setAttribute('data-reply',src.nof_posts);
//      th.setAttribute('data-bump',src.time_bumped);
//      th.setAttribute('data-time',src.time_created);
//    },
//    catalog_from_native_1 : function(th,board) { // working code
//      var th2 = {domain:'8chan', board:board, pn:th};
//      this.parse_funcs['catalog_html'].entry(th2,this.parse_funcs['catalog_html']['full_th']);
//      return th2;
//    },
    parse_funcs : { // vichan
      'catalog_html' : {
//        ths: function(doc) {
//          var ths = this.ths_array(doc,doc.pn.getElementsByClassName('mix'));
//          for (var i=0;i<ths.length;i++) ths[i].pn.getElementsByTagName('a')[0].removeAttribute('href');
//          return ths;
//        },
        ths: function(doc) {return this.ths_array(doc,doc.pn.getElementsByClassName('mix'));},
        no : function(th){return parseInt(th.pn.getElementsByTagName('img')[0].id.substr(4),10);},
        time_bumped: function(th){return parseInt(th.pn.getAttribute('data-bump'),10)*1000;},
        time_created : function(th){return parseInt(th.pn.getAttribute('data-time'),10)*1000;},
        nof_posts: function(th){return parseInt(th.pn.getAttribute('data-reply'),10) +1;},
//        nof_files: function(th){return parseInt(th.pn.getElementsByClassName('replies')[0].getElementsByTagName('strong')[0].textContent.replace(/.*I: */,''),10);},
        nof_files: function(th){return parseInt(th.pn.getElementsByTagName('strong')[0].textContent.replace(/.*I: */,''),10) +1;}, // assumes OP has 1 pic.
        key: function(th){
//          if (!th.hasOwnProperty('no')) th['no'] = this['no'](th);
if (pref.test_mode['0']) {
          if (!th.hasOwnProperty('no')) Object.defineProperty(th,'no',{value:this['no'](th), enumerable:true, configurable:true, writable:true});
}
          return th.domain + th.board + th.no;
        },
        sub: function(th){
          var sub = th.pn.getElementsByClassName('subject');
          return (sub[0])? sub[0].textContent : '';
        },
        name: function(th){return th.pn.getElementsByTagName('img')[0].getAttribute('data-name');},
        com: function(th){
if (pref.test_mode['0']) {
          if (!th.hasOwnProperty('sub')) th.sub = this.sub(th);
}
          return th.pn[brwsr.innerText].replace(th.pn.getElementsByTagName('strong')[0][brwsr.innerText],'').replace(th.sub,'');
        },
        footer: function(th){return th.pn.getElementsByTagName('strong')[0];},
        sticky: function(th){return null;}, // patch
        format: function(th){th.pn.getElementsByTagName('a')[0].removeAttribute('href');return null;},
        op_img_url: function(th){
          var img = th.pn.getElementsByTagName('img')[0];
          return (img)? img.getAttribute('src') : undefined; // patch.
        },
        missing_info: {time_posted: null},
      },
      'catalog_json' : {
        before_test : ['ths',':ITER',':ALL','ths',['key','time_bumped','nof_posts','nof_files']],
        after_test  : ['time_created','pn','footer'],
        full_hier   : ['ths',':ITER',':ALL','ths',['key','time_bumped','nof_posts','nof_files','pn','footer']],
        ths: function(obj) {
          var ths = [];
          for (var i=0;i<obj.obj.length;i++)
            if (obj.obj[i].threads) for (var j=0;j<obj.obj[i].threads.length;j++) {
              obj.obj[i].threads[j].page = i + '.' + j;
if (!pref.test_mode['0']) {
//              obj.obj[i].threads[j].domain = obj.domain;
//              obj.obj[i].threads[j].board  = obj.board;
//              obj.obj[i].threads[j].parse_funcs = obj.parse_funcs;
//              obj.obj[i].threads[j].__proto__ = site4.parse_funcs_on_demand;
              obj.obj[i].threads[j].sticky = obj.obj[i].threads[j].sticky===1; // overwrite property of the same name before setting prototype.
              obj.obj[i].threads[j].type_html = 'catalog_html';
              obj.obj[i].threads[j].__proto__ = obj.__proto__;
}
              ths[ths.length] = obj.obj[i].threads[j];
            }
          return ths;
        },
        time_bumped: function(th){return th.last_modified*1000;},
        time_created : function(th){return th.time*1000;},
        nof_posts: function(th){return th.replies+1;},
        nof_files: function(th){return th.images+th.omitted_images},
        key: function(th){return th.domain + th.board + th.no;},
//        sub: function(th){return ('sub' in th)? th.sub : '';},
//        name: function(th){return ('name' in th)? th.name : '';},
//        com: function(th){return ('com' in th)? th.com : '';},
//        sticky: function(th){return (th.sticky===1);}, // prevent memory leak.
        sub: function(th){return (th.hasOwnProperty('sub'))? th.sub : '';},
        name: function(th){return (th.hasOwnProperty('name'))? th.name : '';},
        com: function(th){return (th.hasOwnProperty('com'))? th.com : '';},
//        sticky: function(th){return (th.hasOwnProperty('sticky'))? th.sticky==='1' : false;},
        op_img_url: 'DEFAULT.common',
////        op_img_url: function(obj) { // working code.
////          return site2[obj.domain].protocol + '//' + site2[obj.domain].domain_url + obj.board + 'thumb/' + obj.tim + ((obj.ext==='.jpg')? '.png' : obj.ext);
//////          return this.protocol+ '//' + site2[obj.domain].domain_url + obj.board + 'thumb/' + obj.tim + ((obj.ext==='.jpg')? '.png' : obj.ext);
////        },
        missing_info: null,
        proto: 'catalog_html',
      },
      'page_json' : {
        has_posts: true,
        proto:'catalog_json'
      },
      'page_html' : {
        before_test : ['ths',':ITER',':ALL','ths',['key','time_bumped','nof_posts','nof_files']],
//        after_test  : [':ITER',':ALL','posts',['sub','name','com'],'flags'],
        after_test  : ['time_created',':ITER',':ALL','posts',['sub','name','com','flag'],':ITER',':GALL','posts',['flags','flag']],
        before_test_post : ['posts',':ITER',':FL','posts',['time'],'html_org','footer'],
        ths: function(doc) {return this.ths_array(doc,doc.pn.querySelectorAll('div[id^=thread_]'));},
        th_init: function(th){
          if (site.whereami!=='page' || !pref.catalog.embed_page) th.pn.removeAttribute('class');
//          var as = th.pn.querySelectorAll('.files a');
//          for (var j=0;j<as.length;j++) as[j].removeAttribute('href');
////          for (var j=0;j<as.length;j++) as[j].addEventListener('click',th.parse_funcs.preventDefault,false); // not debugged.
        },
//        th_destroy: function(pn, parse_funcs){
////          var as = pn.querySelectorAll('.files a');
////          for (var j=0;j<as.length;j++) as[j].removeEventListener('click',parse_funcs.preventDefault,false); // not debugged.
//        },
//        ths: function(doc) {
//          var ths = this.ths_array(doc,doc.pn.querySelectorAll('div[id^=thread_]'));
//          if (site.whereami!=='page' || !pref.catalog.embed_page) for (var i=0;i<ths.length;i++) ths[i].pn.removeAttribute('class');
//          for (var i=0;i<ths.length;i++) {
//            var as = ths[i].pn.querySelectorAll('.files a');
//            for (var j=0;j<as.length;j++) as[j].removeAttribute('href');
//          }
//          return ths;
//        },
        no : function(th){return parseInt(th.pn.id.substring(th.pn.id.indexOf('_')+1),10);},
        post_no: 'page_html.no',
        time: function(post){return Date.parse(post.pn.getElementsByTagName('time')[0].getAttribute('datetime'));},
        time_posted: function(th){
if (pref.test_mode['0']) {
          if (!th.hasOwnProperty('posts')) this.entry(th,this.before_test_post);
}
          return th.posts[th.posts.length-1].time;
        },
        time_bumped: function(th){ // TO BE FIXED.
if (pref.test_mode['0']) {
          if (!th.hasOwnProperty('posts')) this.entry(th,this.before_test_post);
}
          return th.posts[th.posts.length-1].time;
        },
        time_created : function(th){
if (pref.test_mode['0']) {
          if (!th.hasOwnProperty('posts')) this.entry(th,this.before_test_post);
}
          return th.posts[0].time;
        },
        nof_posts: function(th){
          var nof_posts = th.pn.getElementsByClassName('post').length;
          var nof_files = th.pn.getElementsByClassName('fileinfo').length;
          var om_info   = th.pn.getElementsByClassName('omitted')[0];
          if (om_info) {
            var str = om_info[brwsr.innerText].replace(/\n/g,'');
            nof_posts += parseInt(str.replace(/\ post.*/,''),10);
            nof_files += parseInt('0'+str.replace(/\ image.*/,'').replace(/[^\ ]*\ /g,''),10);
          }
//          th.nof_files = nof_files;
          Object.defineProperty(th,'nof_files',{value:nof_files, enumerable:true, configurable:true, writable:true});
          return nof_posts;
        },
        nof_files: function(th){
          if (!th.hasOwnProperty('nof_posts')) this['nof_posts'](th);
          return th.nof_files;
        },
        key: function(th){
//          if (!th.hasOwnProperty(('no')) th.no = this.no(th);
if (pref.test_mode['0']) {
          if (!th.hasOwnProperty('no')) Object.defineProperty(th,'no',{value:this['no'](th), enumerable:true, configurable:true, writable:true});
}
          return th.domain + th.board + th.no;
        },
        sub:  function(post){
          var sub = post.pn.getElementsByClassName('subject')[0];
          return (sub)? sub[brwsr.innerText] : '';
        },
        name: function(post){
          var name = post.pn.getElementsByClassName('name')[0];
          return (name)? name[brwsr.innerText] : '';
        },
        pn_name: function(post){return post.pn.getElementsByClassName('name')[0];},
        com:  function(post){
          var com = post.pn.getElementsByClassName('body')[0];
          return (com)? com[brwsr.innerText] : '';
        },
        footer: function(th){return this.insert_footer4(th.pn.getElementsByClassName('post op')[0]);},
//        footer: function(th){
//          var footer = document.createElement('div');
//          footer = th.pn.insertBefore(footer,th.pn.getElementsByClassName('post op')[0]);
//          return footer;
//        },
        sticky: function(th){return (th.pn.getElementsByClassName('fa-thumb-tack').length!=0);},
//        flag: function(post){return post.pn.getElementsByClassName('flag')[0];},
        flag: function(post){
          var flags = post.pn.getElementsByClassName('flag');
          return (flags.length!=0)? document.importNode(flags[0],false) : null;
        },
//        flags: function(th){
//          var flags = th.pn.getElementsByClassName('flag');
//          var pn_flags = [];
//          for (var i=0;i<flags.length;i++) pn_flags.push(flags[i].cloneNode(false));
//          return pn_flags;
//        },
//        flags: function(th){ // for on demand access.
//          var flags = [];
//          var i = th.posts.length - pref.catalog_t2h_num_of_posts;
//          if (i<1) i=1;
//          if (th.posts.length!=0) flags[0] = th.posts[0].flag;
//          while (i<th.posts.length) {
//            if (th.posts[i]) flags[i] = th.posts[i].flag;
//            i++;
//          }
//          return flags;
//        },
        op_img_url: function(th){
          var img = th.pn.getElementsByTagName('img');
          if (img.length>=2) {
            th.op_img_url2 = [];
            for (var i=1;i<img.length;i++) {
              var url2 = img[i].getAttribute('src');
              if (url2) th.op_img_url2[th.op_img_url2.length] = url2;
            }
          }
          return (img && img[0])? img[0].getAttribute('src') : undefined; // patch.
        },
        tn_as: function(th){return th.tn_imgs;},
        tn_imgs: function(th){
          var imgs = [];
          var files = th.pn.getElementsByClassName('file');
          for (var i=0;i<files.length;i++) imgs[i] = files[i].getElementsByTagName('img')[0];
          return imgs;
        },
      },
      'thread_html' : {
        after_test  : ['time_created',':ITER',':FLx','posts',['sub','name','com','flag'],':ITER',':GFLx','posts',['flags','flag']],
//        'finisher' : function(th){site2['8chan'].remove_posts(th.pn,pref.catalog_t2h_num_of_posts);},
////        pop_post: function(th){ // working code.
////          while (th.idx_pop>=0) {
////            var pn = th.children[th.idx_pop--];
////            if (pn.className && pn.className.indexOf('post')!=-1 && pn.className.indexOf('reply')!=-1) {
////              th.post = {pn:pn, parse_funcs:this, __proto__:th.__proto__};
////              return true;
////            }
////          }
////          return false;
////        },
        proto: 'page_html',
      },
      'thread_json' : {
        nof_posts: function(obj){return obj.posts.length;},
        nof_files: function(obj){
          var count=0;
          for (var i=0;i<obj.posts.length;i++) if (obj.posts[i].filename) count++;
          return count;
        },
        add_op_img_url: site2['DEFAULT'].parse_parts.add_op_img_url,
        proto: 'DEFAULT.thread_json',
      },
    },
    update_posts_remove: function(th_old,i,pnode){
      pnode.removeChild(th_old.posts[i].pn.parentNode.nextSibling);
      pnode.removeChild(th_old.posts[i].pn.parentNode);
    },
    update_posts_insert: function(th,th_old,i,pnode){
      var ref = (i==1)? (th_old.posts[0].pn.nextSibling || null) :
                        (th_old.posts[th_old.posts.length-1].pn.parentNode.nextSibling || null);
      pnode.insertBefore(document.createElement('br'),ref);
      if (!th.posts[i].pn) th.posts[i].pn = this.post_json2html(th.posts[i],th.board);
      pnode.insertBefore(this.post_container(th.posts[i].pn,th.posts[i].no), ref);
    },
    format_pn: function(pn,thq_no){
      if (pref.page.colorID) this.colorID(pn);
      if (pref.page.backlink) {
        var backlinks = (thq_no)? ((Array.isArray(thq_no))? thq_no : thq_no.backlinks) : null;
        if (backlinks) this.add_backlinks(pn,backlinks);
      }
    },
    add_backlinks: function(pn,backlinks,target){
      var bks = pn.getElementsByClassName('mentioned')[0];
      if (!bks) {
        var bks = document.createElement('span');
        bks.setAttribute('class','mentioned unimportant');
        var ref = pn.getElementsByClassName('post_no')[1];
        ref.parentNode.insertBefore(bks,ref.nextSibling);
      }
      if (!target) bks.innerHTML = '';
      for (var i=(target || 0);i<backlinks.length;i++) {
        var href = backlinks[i].split('/');
        var post_no = href[href.length-1].substr(href[href.length-1].indexOf('#')+1);
        href[href.length-1] = 'res/'+href[href.length-1].replace('#','.html#');
        href = href.join('/');
//        bk_str += '<a class="mentioned" onclick="highlightReply(\''+post_no+'\');" href="'+href+'">&gt;&gt;'+post_no+'</a>';

        var blk = null;
        if (target!==undefined)
          for (var j=0;j<bks.childNodes.length;j++)
            if (bks.childNodes[j].textContent==='>>'+post_no) {
              blk = bks.childNodes[j];
              break;
            }
        if (!blk) {
          blk = document.createElement('a');
          blk.setAttribute('class','mentioned');
          blk.setAttribute('href',href);
          blk.textContent = '>>'+post_no;
          blk.onclick = this.backlink_onclick;
          bks.appendChild(blk);
        }
        blk.onmouseover = this.popups_post_entry;
        if (target) break;
      }
    },
    backlink_onclick: function(){
      highlightReply.call(this,parseInt(this.textContent.substr(2),10));
    },
    backlink_class: 'mentioned',
    colorID: function(pn) {
      var id = pn.getElementsByClassName('poster_id')[0];
      if (id) {
        var bg = id.textContent;
        var bg_r = parseInt(bg.substr(0,2),16);
        var bg_g = parseInt(bg.substr(2,2),16);
        var bg_b = parseInt(bg.substr(4,2),16);
        var fg = (bg_r + bg_g + bg_b>384)? 0 : 255;
        id.setAttribute('style','padding: 0px 5px; border-radius: 8px; color: rgb('+fg+','+fg+','+fg+'); background-color: rgb('+bg_r+','+bg_g+','+bg_b+');');
      }
    },
    post_container : function(post_pn,no) {
      var pn = document.createElement('div');
      pn.setAttribute('id','pc'+no);
      pn.setAttribute('class','postcontainer');
      pn.innerHTML = '<div class="sidearrows">&gt;&gt;</div>';
      pn.appendChild(post_pn);
      return pn;
    },
    post_json2html : function(post, board) {
      var pn = document.createElement('div');
      var tunit = 1000;
      var html_str =
        '<div class="post reply" id="reply_'+post.no+'" style="border: none">'+
          '<p class="intro">'+
//////////                     '<input type="checkbox" class="delete" name="delete_12486" id="delete_12486">'+
            '<label for="delete_'+post.no+'">'+
              '<span class="name">'+post.name+'</span> '+
              '<time datetime="'+ new Date(post.time*tunit).toISOString() + '">' + new Date(post.time*tunit).toLocaleString()+'</time>'+
            '</label>'+
            ((post.id)? '<span class="poster_id">'+post.id+'</span>' : '')+
            '&nbsp;'+
            '<a class="post_no" id="post_no_'+post.no+'">No.</a>'+
//            '<a class="post_no" onclick="citeReply(12486)" href="/tech/res/12393.html#q12486">12486</a>'+
            '<a class="post_no">'+post.no+'</a>'+
//////////            '<span class="mentioned unimportant"><a class="mentioned-12497" onclick="highlightReply('12497');" href="#12497">&gt;&gt;12497</a></span>'+
          '</p>';
      if (post.filename) html_str += this.post_json2html_file(post,board);
      if (post.extra_files) for (var i=0;i<post.extra_files.length;i++) html_str += this.post_json2html_file(post.extra_files[i],board);
      html_str +=
          '<div class="body">'+post.com+
//////////            '<a onclick="highlightReply('12446');" href="/tech/res/12393.html#12446">&gt;&gt;12446</a><br>'+
//////////            '<a onclick="highlightReply('12403');" href="/tech/res/12393.html#12403">&gt;&gt;12403</a><br>'+
//////////            '<span class="quote"><br>&gt;people saying nice things about openstack</span><br><br>Thanks, lainons. I work on developing openstack and people seem to love complaining about it, so it's heartening to hear somewhat happy people.'+
          '</div>'+
        '</div>';
      pn.innerHTML = html_str;
      return pn.childNodes[0];
    },
    post_json2html_file : function(post, board) {
      var fsize_str = (((post.fsize>1048576)? post.fsize/1048576 : post.fsize/1024)+0.005).toString();
      fsize_str = fsize_str.substr(0,fsize_str.indexOf('.')+3) + ((post.fsize>1048576)? ' MB' : ' KB');
      var fname = post.tim+post.ext;
      var furl = board+'src/'+fname;
      var turl = this.catalog_json2html3_thumbnail(post,board);
      var html_str = 
            '<div class="files">'+
              '<div class="file">'+
                '<p class="fileinfo">File: '+
                  '<a href="'+furl+'">'+fname+'</a>'+
                  '<span class="details">('+fsize_str+', '+post.w+'x'+post.h+', '+
                    '<span class="postfilename">'+post.filename+post.ext+'</span>) '+
////////                  '<span class="unimportant image_id">'+
//////////                    '<a href="http://imgops.com/https://lainchan.org/tech/src/1445201930315.jpg" target="_blank">ImgOps</a>'+
//////////                    '<a href="http://regex.info/exif.cgi?url=https://lainchan.org/tech/src/1445201930315.jpg" target="_blank">Exif</a>'+
//////////                    '<a href="http://iqdb.org/?url=https://lainchan.org/tech/src/1445201930315.jpg" target="_blank">iqdb</a>'+
////////                  '</span>'+
                  '</span>'+
                '</p>'+
                '<a href="'+furl+'" target="_blank">'+
                  '<img class="post-image" src="'+turl+'" style="width: '+post.tn_w+'px; height: '+post.tn_h+'px; max-width: 98%;" alt="">'+
                '</a>'+
              '</div>'+
            '</div>';
      return html_str;
    },
    catalog_json2html3_thumbnail: function(obj, board) {
      return ((obj.ext==='.jpg' || obj.ext==='.jpeg' || obj.ext==='.gif' || obj.ext==='.png')? 'https://' + site2['8chan'].domain_url + board + 'thumb/' + obj.tim + obj.ext : '');
    },
    catalog_json2html3 : function(obj,board,thumb_url) {
      var th = document.createElement('div');
      th.setAttribute('class','mix');
      th.setAttribute('style','display: inline-block;');
//      if (obj.ext==='.gif' || obj.ext==='.png') obj.ext='.jpg';
      if (obj.ext==='.gif' || obj.ext==='.jpeg') obj.ext='.jpg';
      th.innerHTML = '<div class="thread grid-li grid-size-' + site2['8chan'].catalog_native_size + '">' +
//                     '<a href="' + thumb_url + '">' +
                     '<a>' +
                       '<img src="' + thumb_url +
                       '" id="img-' + obj.no +
                       '" data-subject="' + obj.sub +
                       '" data-name="' + obj.name +
                       '" data-muhdifference="" data-last-reply="" data-last-subject="" data-last-name="" data-last-difference=""' +
                       'class="' + board + ' thread-image" title="' + new Date(obj.last_modified*1000).toLocaleString() + ' '+obj.ext + '"></a>' +
                     '<div class="replies"><strong>R: ' + (obj.nof_posts-1) +' / I: ' + obj.nof_files +
//                     ((pref.catalog_footer_show_board_name)? ' '+board : '')
                     '</strong>' + 
                     ((obj.sub)? '<p class="intro"><span class="subject">' + obj.sub + '</span></p>' : '<br>') +
                     obj.com + '</div></div>';
      return th;
    },
//    catalog_json2html3 : function(obj,board) {
//      th = document.createElement('div');
////      if (obj.ext==='.gif' || obj.ext==='.png') obj.ext='.jpg';
//      if (obj.ext==='.gif' || obj.ext==='.jpeg') obj.ext='.jpg';
//      th.innerHTML = '<div class="thread grid-li grid-size-small"><a href="'
//                   + site2['8chan'].make_url3(board,obj.no) + '"><img src="'
//                   + ((obj.ext==='.jpg' || obj.ext==='.jpeg' || obj.ext==='.gif' || obj.ext==='.png')? 'https://' + site2['8chan'].domain_url + board + 'thumb/' + obj.tim + obj.ext : '')
//                   + '" id="img-'
//                   + obj.no  + '" data-subject="'
//                   + obj.sub + '" data-name="'
//                   + obj.name+ '" data-muhdifference="" data-last-reply="" data-last-subject="" data-last-name="" data-last-difference=""'
////                   + 'class="scriptcdc thread-image" title="' + new Date(obj.last_modified*1000).toLocaleString() +'"></a>'
//                   + 'class="'+board+' thread-image" title="' + new Date(obj.last_modified*1000).toLocaleString() + ' '+obj.ext + '"></a>'
//                   + '<div class="replies"><strong>R: '
//                   + obj.replies +' / I: '
//                   + (obj.images+obj.omitted_images)
////                   + ((pref.catalog_footer_show_board_name)? ' '+board : '')
//                   + '</strong>'
//                   + ((obj.sub)? '<p class="intro"><span class="subject">' + obj.sub + '</span></p>' : '')
//                   + obj.com + '</div></div>';
//      return th;
//    },
    catalog_from_json3 : function(obj,board) {
      var ths;
if (pref.test_mode['0']) {
      ths = {domain:'8chan', board:site.board, obj:obj};
      this.parse_funcs['catalog_json'].entry(ths,this.parse_funcs['catalog_json']['full_hier']);
} else {
//      ths = {domain:'8chan', board:board, obj:obj, parse_funcs:this.parse_funcs['catalog_json'], __proto__:site4.parse_funcs_on_demand};
////      var parse_obj = {domain:'8chan', board:board, parse_funcs:this.parse_funcs['catalog_json'], __proto__:site4.parse_funcs_on_demand};
////      ths = {obj:obj, __proto__:parse_obj};
      return site2[this.nickname].wrap_to_parse.get(obj, this.nickname, board, 'catalog_json');
}
      return ths.ths;
    },
//    catalog_json2html2 : function(obj,board) {
//      th = document.createElement('div');
//      th.setAttribute('data-reply',obj.replies);
//      th.setAttribute('data-bump',obj.last_modified);
//      th.setAttribute('data-time',obj.time);
////      if (obj.ext==='.gif' || obj.ext==='.png') obj.ext='.jpg';
//      if (obj.ext==='.gif' || obj.ext==='.jpeg') obj.ext='.jpg';
//      th.innerHTML = '<div class="thread grid-li grid-size-small"><a href="'
//                   + site2['8chan'].make_url3(board,obj.no) + '"><img src="'
////                   + ((obj.ext==='.jpg' || obj.ext==='.jpeg' || obj.ext==='.gif' || obj.ext==='.png')? 'https://media.' + site2['8chan'].domain_url + board + 'thumb/' + obj.tim + obj.ext : '')
//                   + ((obj.ext==='.jpg' || obj.ext==='.jpeg' || obj.ext==='.gif' || obj.ext==='.png')? 'https://' + site2['8chan'].domain_url + board + 'thumb/' + obj.tim + obj.ext : '')
//                   + '" id="img-'
//                   + obj.no  + '" data-subject="'
//                   + obj.sub + '" data-name="'
//                   + obj.name+ '" data-muhdifference="" data-last-reply="" data-last-subject="" data-last-name="" data-last-difference=""'
////                   + 'class="scriptcdc thread-image" title="' + new Date(obj.last_modified*1000).toLocaleString() +'"></a>'
//                   + 'class="scriptcdc thread-image" title="' + new Date(obj.last_modified*1000).toLocaleString() + ' '+obj.ext + '"></a>'
//                   + '<div class="replies"><strong>R: '
//                   + obj.replies +' / I: '
//                   + (obj.images+obj.omitted_images)
////                   + ((pref.catalog_footer_show_board_name)? ' '+board : '')
//                   + '</strong>'
//                   + ((obj.sub)? '<p class="intro"><span class="subject">' + obj.sub + '</span></p>' : '')
//                   + obj.com + '</div></div>';
//      return th;
//    },
//    catalog_from_json2 : function(doc_json,board) {
//    catalog_from_json2 : function(obj,board) {
////      var obj = JSON.parse(doc_json);
//      var ths = [];
//      for (var i=0;i<obj.length;i++)
//        for (var j=0;j<obj[i].threads.length;j++) {
//          var name = '8chan' + board + obj[i].threads[j].no;
//          var pn = site2['8chan'].catalog_json2html2(obj[i].threads[j],board);
//          ths.push(site2['8chan'].catalog_from_native_1(pn,board));
//          ths[ths.length-1][14] = i + '.' +j;
//        }
//      return ths;
//    },
    proto : 'DEFAULT'
  };
  site2['KC'] = {
    nickname : 'KC',
    domain_url: 'krautchan.net',
//    features : {thread_reader: true},
    components: {
      boardlist: '.menu',
    },
    pref_default: {
      thread_reader:{own_posts_tracker:true, check_num_of_children: false}
    },
    check_func : function(){
      if (!site2['KC'].force_https) site2['KC'].protocol = site.protocol;
      if (window.location.href.search(/krautchan.net/)!=-1) { // Krautchan
        site.config('krautchan.net','KC');
        site.max_page  = (site2['KC'].max_page_kc[site.board]==undefined)? 10 : site2['KC'].max_page_kc[site.board];
        site.whereami = (document.getElementsByTagName('head')[0].innerHTML.indexOf('404 Not Found')!=-1)? '404'
                      : (window.location.href.search(/krautchan\.net\/?$/)!=-1)? 'frame'
                      : (window.location.href.search(/catalog/)!=-1)? 'catalog'
                      : (window.location.href.search(/thread/)!=-1)? 'thread'
                      : (window.location.href.search(/\/$|(index|[0-9]+)\.html|\/#all$/)!=-1)? 'page'
                      : 'other';
        if (site.whereami==='catalog') site.board = window.location.href.substr(window.location.href.lastIndexOf('/'))+'/';
        if (site.whereami==='frame') {
          site.root_body2 = document.createElement('div');
          site.embed_frame = 'main';
          site.embed_frame_win = main;
          navigation.onload = function(){
            site.root_body = navigation.document.body;
            site.root_body.appendChild(site.root_body2);
          };
        }
        if (site.whereami==='thread' || site.whereami==='page') {
          site.embed_to['top']    = document.querySelector('form[action="/delete"]');
          site.embed_to['bottom'] = document.querySelector('form[action="/delete"]').nextSibling;
//        } else if (site.whereami==='catalog') {
//          site.embed_to['top']    = document.getElementsByTagName('header')[0].nextSibling;
//          site.embed_to['bottom'] = document.getElementsByTagName('footer')[0];
        }
        site.postform = document.getElementById('postform');
        site.postform_comment = document.getElementById('postform_comment');
        site.postform_submit = document.getElementById('postform_submit');
        site.postform_rules = document.getElementById('rules_row');
////        this.pref_default(pref); // working code.
        return true;
      } else return false;
    },
////    pref_default: function(pref){ // working code.
////      pref.thread_reader.own_posts_tracker = true;
////      pref.thread_reader.check_num_of_children = false;
////    },
    force_https : false,
    protocol : 'https:',
//    home : site.protocol + '//krautchan.net', // cause memory leak
    home : site.protocol + '//krautchan.net/regeln.html',
    catalog_frame_prep: function(pn12){
      var source = [navigation.document.body, main.document.body];
//      for (var i=0;i<2;i++) {
//        var container = document.createElement('div');
//        container.style.display = 'none';
//        while (source[i].childNodes.length!=0) container.appendChild(source[i].childNodes[0]);
//        source[i].appendChild(container);
//      }
      site2['common'].absorb_children(source[0]).style.display = 'none';
      site2['common'].absorb_children(source[1]).style.display = 'none';
      source[0].insertBefore(pn12,source[0].firstChild);
      source[0].insertBefore(pn12,source[0].firstChild);
      site.root_body.appendChild(site.root_body2);
      this.catalog_embed_prep(pn12);
    },
////    catalog_background : '#cfcede',
////    catalog_background : '#dadafc',
//    catalog_background : '#e0e0fc',
//    catalog_bordercolor : '#aaaacc',
//    catalog_threads_in_page : function(doc){return doc.getElementsByClassName('thread');},
    catalog_threads_in_page : function(doc){return doc.getElementsByClassName('thread_body');},
//    remove_posts : function(doc){
//      var threads_body = doc.getElementsByClassName('thread_body');
//      var posts = [];
//      for (var i=0;i<threads_body.length;i++) {
//        posts_in_thread = threads_body[i].getElementsByTagName('table');
//        for (var j=0;j<posts_in_thread.length;j++) posts.push(posts_in_thread[j]);
//      }
//      for (var i=posts.length-1;i>=0;i--) posts[i].innerHTML = '';
//      return doc;
//    },
    max_page_kc : {
      '/int/' : 20,
      '/b/'   : 15,
      '/trv/' : 13,
      '/m/'   : 5
    },
    max_page: function(bn){return site2['KC'].max_page_kc[bn];},
    make_url4 : function(dbt){
      var url_prefix = this.protocol + '//' + this.domain_url;
      dbt[3] = dbt[3].replace(/_json/,'_html');
      if      (dbt[3]==='page_html')    return [url_prefix + dbt[1] + ((dbt[2]==0)? '' : dbt[2] + '.html'), 'html'];
      else if (dbt[3]==='catalog_html') return [url_prefix + '/catalog' + dbt[1].substr(0,dbt[1].length-1), 'html'];
      else if (dbt[3]==='thread_html')  return [url_prefix + dbt[1] + 'thread-' + dbt[2] + '.html', 'html'];
    },
//////////    make_url : function(board,no){return [site2['KC'].protocol + '//krautchan.net' + board + ((no==0)? '' : no + '.html'), 'html'];}, // working code.
////////    make_url : function(board,no,key){
////////      var url_prefix = site2['KC'].protocol + '//krautchan.net';
////////      return (key==='p')? [url_prefix + board + ((no==0)? '' : no + '.html'), 'html'] : 
////////                          [url_prefix + '/catalog' + board.substr(0,board.length-1),'html'];
////////    },
////////    make_url3: function(board,th){return  site2['KC'].protocol + '//krautchan.net' + board + 'thread-' + th + '.html';},
    get_ops : function(doc){
      var ops = [];
      var divs = doc.getElementsByTagName('div');
      for (var i=0;i<divs.length;i++)
        if (divs[i].className == 'thread' || divs[i].className == 'thread kc_showReplies')
          ops.push(divs[i].id.substring(7)); // substring(7) for removing 'thread_'
      return ops;
    },
    get_posts : function(doc) {
      var posts = [];
      var anchors = doc.getElementsByTagName('a');
      for (var i=0;i<anchors.length;i++) if (anchors[i].name != '') posts.push(anchors[i].name);
      return posts;
    },
    get_thread_link : function(pn,boardname,del){
//      var keyword = (boardname=='/int/')? 'Reply' : 'Antworten';
      var as = pn.getElementsByClassName('postheader')[0].getElementsByTagName('a');
//      for (var i=0;i<as.length;i++) if (as[i][brwsr.innerText]==keyword) return as[i].getAttribute('href');
//      for (var i=0;i<as.length;i++) if (as[i].innerHTML==keyword) {
      for (var i=0;i<as.length;i++) if (as[i][brwsr.innerText]=='Reply' || as[i][brwsr.innerText]=='Antworten') {
        var href = as[i].getAttribute('href');
        if (del) {
          var j=0;
          var parent = as[i].parentNode;
          while (parent.childNodes[j]!=as[i]) j++;
          parent.removeChild(parent.childNodes[j+1]);
          parent.removeChild(as[i]);
          parent.removeChild(parent.childNodes[j-1]);
        } else as[i].setAttribute('target',(pref.catalog_open_in_new_tab)? '_blank' : '_self');
        return href;
      }
      return null;
    },
    modify_thread_link : function(pn){
      var retval = [];
      var as = pn.getElementsByClassName('postheader')[0].getElementsByTagName('a');
      for (var i=0;i<as.length;i++) if (as[i][brwsr.innerText]=='Reply' || as[i][brwsr.innerText]=='Antworten') {
        var href = as[i].getAttribute('href');
        retval.push([as[i],href]);
        as[i].removeAttribute('href');
      }
      return retval;
    },
//    add_thread_link : function(doc,url){
//      var pn = document.createElement('a');
//      pn.href = url.replace(/https*:\/\/krautchan\.net/,'');
//      pn.innerHTML = 'Reply';
//      var th = doc.getElementsByClassName('postheader')[0];
//      if (th) {
//        th.insertBefore(pn,th.firstChild);
//        th.insertBefore(document.createTextNode('['),pn);
//        th.insertBefore(document.createTextNode(']'),pn.nextSibling);
//      }
//    },
    time_offset : 1, // 1 for usual, 2 for summer time.
    get_time_of_posts : function(doc){
      var postdates = doc.getElementsByClassName('postdate');
      return [parseInt(brwsr.Date_parse(postdates[postdates.length-1][brwsr.innerText]),10) - site2['KC'].time_offset*3600000,
              parseInt(brwsr.Date_parse(postdates[0                 ][brwsr.innerText]),10) - site2['KC'].time_offset*3600000];
    },
//    get_time_of_posts : function(th){ // cause error
//      var posts = th.getElementsByTagName('table');
//      return [site2['KC'].get_time_of_post_in_utc(posts[posts.length-1]),site2['KC'].get_time_of_post_in_utc(posts[0])];
//    },
    get_time_of_post_in_utc : function(post){
      var postdates = post.getElementsByClassName('postdate');
      if (postdates[0]) return parseInt(brwsr.Date_parse(postdates[0][brwsr.innerText]),10) - site2['KC'].time_offset*3600000;
    },
    mark_newer_posts: function(th,date,unmark) {
      var pn = site2['DEFAULT'].mark_newer_posts('KC',th.getElementsByTagName('table'),date,'border:2px solid red','border: none','class','postreply',unmark);
      return (pn!=null)? pn.offsetParent : null;
    },
    format_time : function(th){
      var times = th.getElementsByClassName('postdate');
      for (var i=0;i<times.length;i++) times[i][brwsr.innerText] = site2.common.change_utc_to_local(brwsr.Date_parse(times[i][brwsr.innerText])-site2['KC'].time_offset*3600000);
    },
    remove_files_info : function(th){
      site2.common.remove_by_classname(th,'filename');
      site2.common.remove_by_classname(th,'fileinfo');
      var imgs = th.getElementsByTagName('img');
      for (var i=0;i<imgs.length;i++) if (imgs[i].id && imgs[i].id.search('thumbnail')!=-1) {
        imgs[i].removeAttribute('onmouseover');
        imgs[i].removeAttribute('onmouseout');
        imgs[i].removeAttribute('onload');
        site2.common.move_up_and_delete_parent([imgs[i]]);
      }
      var files = th.getElementsByClassName('file_thread');
      for (i=0;i<files.length;i++) site2.common.remove_brs(files[i]);
      for (i=0;i<files.length;i++) site2.common.remove_by_attribute([files[i]],'id','filename');
//      site2.common.remove_by_classname(th,'file_thread');
//      site2.common.remove_by_classname(th,'postbody');
    },
////////    insert_footer : function(th,page_no,bn,exe,date,nof_posts,nof_files){
////////      var key = (!brwsr.ff)? 'innerText' : 'innerHTML';
////////      var posts = th.getElementsByTagName('table');
////////      nof_posts += posts.length +1; // +1 for OP.
////////      var files = th.getElementsByClassName('file_thread');
////////      nof_files += th.getElementsByClassName('filename').length;
////////      var om_info = th.getElementsByClassName('omittedinfo');
////////      if (om_info[0]) {
////////        var str = om_info[0][key].replace(/\n/g,'');
////////        nof_posts += parseInt(str.replace(/\ post.*/,''),10);
////////        nof_files += parseInt('0'+str.replace(/\ file.*/,'').replace(/[^\ ]*\ /g,''),10);
////////      }
////////      if (exe) {
////////        var pn = document.createElement('div');
//////////        pn.name = 'catalog_footer';
////////        pn.setAttribute('name','catalog_footer');
//////////        pn[key] = bn + '  ' + nof_posts + '/' + nof_files + '/' + page_no + '  ';
////////        pn.innerHTML = '<span>' + bn + '  ' + nof_posts + '/' + nof_files + '/' + page_no + '  </span>';
////////        var imgs = th.getElementsByTagName('img');
////////        for (var i=0;i<imgs.length;i++) {
//////////          if (imgs[i].src && imgs[i].getAttribute('src').search(/images\/balls/)!=-1) pn.appendChild(imgs[i].cloneNode(false)); // doesn't work in KC.
////////          if (imgs[i].getAttribute('src') && imgs[i].getAttribute('src').search(/images\/balls/)!=-1) pn.appendChild(imgs[i].cloneNode(false));
////////        }
////////        th.insertBefore(pn,files[0]);
////////      }
////////      return [nof_posts,nof_files];
////////    },
    remove_posts : function(th,end){
//      site2.common.remove_by_tagname(th,'table',end);
//      site2.common.remove_double_tags(th,'A');
      var tgts = th.getElementsByTagName('table');
      for (var i=tgts.length-1-end;i>=0;i--) {
        if (tgts[i].previousSibling.previousSibling) tgts[i].parentNode.removeChild(tgts[i].previousSibling.previousSibling); // a tags
        tgts[i].parentNode.removeChild(tgts[i].previousSibling); // text
//if (!pref.test_mode['14']) tgts[i].setAttribute('style','display:none;'+(tgts[i].getAttribute('style') || ''));
//else
        tgts[i].parentNode.removeChild(tgts[i]);
      }
    },
    absolute_link : function(doc){
      var all = doc.getElementsByTagName('*');
      for (var i=0;i<all.length;i++) {
        if (all[i].getAttribute('src'))  all[i].setAttribute('src', site2['KC'].protocol + '//krautchan.net'+all[i].getAttribute('src'));
        if (all[i].getAttribute('href')) all[i].setAttribute('href',site2['KC'].protocol + '//krautchan.net'+all[i].getAttribute('href'));
      }
    },
    format_thread_layout : function(th){
      site2.common.add_attribute_by_classname(th,'file_thread','style','float:left;margin:5px');
      site2.common.add_attribute_by_classname(th,'file_reply','style','float:left;margin:5px');
      th.getElementsByTagName('blockquote')[0].setAttribute('style','margin:5px;clear:both');
//      var ph = th.getElementsByClassName('postheader');
//      th.insertBefore(ph,th.getElementsByClassName('postbody')[0]);
    },
    format_thread_style : function(th){
      site2.common.add_attribute_by_classname(th,'postreply','style','background:#cacaec');
    },
    format_thread_contents : function(th){
      site2.common.remove_by_tagname(th,'input');
      site2.common.remove_by_classname(th,'report_parent');
      site2.common.remove_by_attribute(th.getElementsByClassName('postheader'),'onclick','hideThread');
      site2.common.remove_by_attribute(th.getElementsByClassName('file_thread'),'onclick','toggleThumbnail');
//      site2.common.add_attribute_by_attribute(th.getElementsByClassName('file_thread'),'onclick','toggleThumbnail','style','display:none');
      site2.common.remove_by_attribute(th.getElementsByClassName('file_thread'),'href','shipainter');
//      site2.common.remove_by_classname(th,'thread_hidden');
      site2.common.remove_by_tagname(th,'hr');
//      site2.common.remove_by_tagname(th,'br');
      site2.common.remove_by_classname(th,'omittedinfo');
    },
    preprocess_html : function(doc_txt,page){ // cause memory leak in chrome, but fail without this in FF or GreaseMonkey.
      if (doc_txt) {
//        if (page) while (doc_txt.search(/<script[>\ ](.|\n)*<\/script>/)!=-1) doc_txt = doc_txt.replace(/<script[>\ ](.|\n)*<\/script>/,''); // slower execution.
//        while (doc_txt.search(/onload="imageFinishedLoading\([0-9]*\)"/)!=-1) doc_txt = doc_txt.replace(/onload="imageFinishedLoading\([0-9]*\)"/,''); // slower execution.
//        if (page) doc_txt = doc_txt.replace(/<script[>\ ](.|\n)*<\/script>/mg,''); // cause leak in Chrome, probably a bug.
        if (page) doc_txt = doc_txt.replace(/<script[> ].*<\/script>/mg,''); // cause leak in Chrome, probably a bug. (remove \n)
        doc_txt = doc_txt.replace(/onload="imageFinishedLoading\([0-9]*\)"/mg,''); // cause leak in Chrome, probably a bug.
// sanitize
        doc_txt = doc_txt.replace(/onmouseover="[^"]*"/mg,'');
        doc_txt = doc_txt.replace(/onmouseout="[^"]*"/mg,'');
        doc_txt = doc_txt.replace(/onclick="[^"]*"/mg,'');
      }
      return doc_txt;
    },
    preprocess_doc : function(doc){
//      site2.common.remove_by_tagname(doc,'script');
      site2.common.remove_attribute(doc,'onload');
      site2.common.remove_attribute(doc,'onmouseover');
      site2.common.remove_attribute(doc,'onmouseout');
      site2.common.remove_attribute(doc,'onclick');

      site2.common.remove_attribute(doc,'onchange');
      site2.common.remove_attribute(doc,'onfocus');
      site2.common.remove_attribute(doc,'onsubmit');
var pns = doc.getElementsByTagName('*');
for (var i=pns.length-1;i>=0;i--)
  if (pns[i].getAttribute && pns[i].getAttribute('href') && pns[i].getAttribute('href').indexOf('javascript:')==0) pns[i].removeAttribute('href');

      doc.getElementsByTagName('html')[0].innerHTML = doc.getElementsByTagName('html')[0].innerHTML; // remake to sanitize.
    },
////////    thread2headline : function(doc){
////////      return site2.common.thread2headline(doc,'KC');
////////    },
    catalog_native_prep: function(date,pn_filter,pn_tb,pn_hi){
      var node_ref = (site.whereami==='catalog')? document.getElementsByClassName('catalog')[0]
                                                : document.querySelector('form[action="/delete"]');
//      var node_ref = (site.whereami==='catalog')? document.getElementById('settings')
//                                                : document.getElementsByName('postcontrols')[0];
//      pn_tb.setAttribute('style', 'float:right');
      site4.tb_prep_for_embed(pn_tb);
//      if (site.whereami==='catalog') {
      node_ref.parentNode.insertBefore(pn_tb,node_ref);
//      var selector_catchan = pn_filter.getElementsByTagName('select')['catalog.indexing'];
//      selector_catchan.childNodes[0].textContent = 'Bump order';
//      if (site.whereami==='catalog') selector_native.parentNode.insertBefore(selector_catchan,selector_native);
////      else pn_tb.childNodes[3].insertBefore(selector_catchan,pn_tb.childNodes[3].firstChild);
      return site2['KC'].catalog_from_native(date,document,site.board,site.whereami+'_html');
    },
    catalog_from_native : function(date,doc,board,type) {
      return site2[this.nickname].wrap_to_parse.get(doc, this.nickname, board, type);
////      var parse_obj = {domain:'KC', board:board, parse_funcs:site2['KC'].parse_funcs[type], __proto__:site4.parse_funcs_on_demand};
////      var ths = {pn:doc, __proto__:parse_obj};
////      return ths.ths;
    },
    catalog_get_native_area: function(){
      if (site.whereami==='page') return document.querySelector('form[action="/delete"]');
      else return document.getElementsByClassName('catalog')[0];
    },
////    get_click_area: function(pn, th){
////      var areas = [];
////      if (th.type_html==='catalog_html') {
////        var tn = pn.getElementsByClassName('thumbnail');
////        for (var i=0;i<tn.length;i++) areas.push(tn[i].getElementsByTagName('img')[0]);
////      } else if (th.type_html==='page_html') {
////        var fths = pn.getElementsByClassName('file_thread');
////        for (var i=0;i<fths.length;i++) {
////          var imgs = fths[i].getElementsByTagName('img');
////          areas.push(imgs[imgs.length-1]);
////        }
////      }
////      return (areas.length!=0)? areas : [pn]; 
////    },
//    get_click_area: function(pn, th){
//      if (th.type_html==='catalog_html') {
//        var tn = pn.getElementsByClassName('thumbnail');
//        return (tn[0])? tn[0].getElementsByTagName('img')[0] : pn;
//      } else if (th.type_html==='page_html') {
//        var imgs = pn.getElementsByClassName('file_thread')[0].getElementsByTagName('img');
//        return imgs[imgs.length-1];
//      }
//    },
    parse_funcs : { // KC
      'catalog_html' : {
        ths: function(doc) {
          var ths = this.ths_array(doc,doc.pn.getElementsByClassName('thread'));
          var t = Date.now() - pref.localtime_offset*3600000; // patch
          for (var i=0;i<ths.length;i++) {
            if (ths[i].time_bumped<0) ths[i].time_bumped += t;
//            var as = ths[i].pn.getElementsByTagName('a');
//            for (var j=0;j<as.length;j++) as[j].removeAttribute('href');
          }
          return ths;
        },
//        th_init: function(th) {
//          var as = th.pn.getElementsByTagName('a');
//          for (var j=0;j<as.length;j++) as[j].addEventListener('click',th.parse_funcs.preventDefault,false);
//        },
//        th_destroy: function(pn, parse_funcs){
//          var as = pn.getElementsByTagName('a');
//          for (var j=0;j<as.length;j++) as[j].removeEventListener('click',parse_funcs.preventDefault,false);
//        },

        no : function(th){return parseInt(th.pn.getAttribute('id').substr(7),10);}, // the same as 4chan.
//        time_bumped: function(th){return 0;},
        time_bumped: function(th){
          return -1 -parseInt(th.page.substr(0,th.page.indexOf('.')),10)*16 - parseInt(th.page.substr(th.page.indexOf('.')+1));},
        time_created : function(th){return 0;},
        nof_posts: function(th){
          var footer = th.pn.getElementsByClassName('omitted_text')[0];
//          Object.defineProperty(th, 'footer', {value:footer, enumerable:true, writable:true, configurable:true});
//          footer.innerHTML = '';
          var nof_posts = (footer)? parseInt(footer.textContent.match(/[0-9]+/),10) : 0;
          return (isNaN(nof_posts))? 1 : nof_posts + 1;
        },
        nof_files: function(th){return 0;},
        key: function(th){return th.domain + th.board + th.no;},
        sub: function(th){
          var sub = th.pn.getElementsByTagName('header')[0].textContent.trim();
          return (sub.search(/^#[0-9]+$/)==0)? '' : sub;
        },
        name: function(th){return '';},
        com: function(th){
          return th.pn.getElementsByTagName('section')[0][brwsr.innerText];
        },
        footer: function(th){
          var footer = th.pn.getElementsByClassName('omitted_text')[0]; // must parse pn because of mimic mode.
          footer.innerHTML = '';
          return footer;
        },
        sticky: function(th){return false;},
//        format: function(th){th.pn.getElementsByTagName('a')[0].removeAttribute('href');return null;},
        op_img_url:function(th){
//          var img = th.pn.getElementsByClassName('thumbnail')[0].getElementsByTagName('img');
          var tn  = th.pn.getElementsByClassName('thumbnail');
          var img = (tn[0])? tn[0].getElementsByTagName('img') : null; // parse other site's html
          var url = (img && img[img.length-1])? img[img.length-1].getAttribute('src') : undefined;
          return url;
        },
      },
      'catalog_json' : {
        proto: 'catalog_html',
      },
      'page_html' : {
        ths: function(doc) {return this.ths_array(doc, doc.pn.getElementsByClassName('thread'));},
        th_init: function(th) {
          th.pn.removeAttribute('class');
          th.pn.style.clear = 'none';
        },
//        th_destroy: function(pn, parse_funcs){},
        no : function(th){return th.pn.id.substr(7);},
//        ths: function(doc) { // working code.
//          var ths = this.ths_array(doc, doc.pn.getElementsByClassName('thread'));
//          for (var i=0;i<ths.length;i++) {
//            Object.defineProperty(ths[i], 'no', {value:ths[i].pn.id.substr(7), enumerable:true, writable:true, configurable:true});
//            ths[i].pn.removeAttribute('class'); // collection ISN'T writable? and if wrote, its enumerator doesn't work.
//            ths[i].pn.style.clear = 'none';
//          }
//          return ths;
//        },
//        no : function(th){return parseInt(th.pn.getElementsByClassName('quotelink')[0][brwsr.innerText],10);},
        posts: function(th){return this.posts_array(th, th.pn.querySelectorAll('.thread_body, td.postreply'));},
//        posts: function(th){return this.posts_array(th, th.pn.querySelectorAll('.thread_body, .postreply'));}, // doesn't work for thread_reader.
//        posts: function(th){ // working code.
//          var posts = [];
//          posts[0] = {pn:th.pn.getElementsByClassName('thread_body')[0], __proto__:th.__proto__}; // OP
//          var replies = th.pn.getElementsByClassName('postreply');
//          for (var i=0;i<replies.length;i++) posts[posts.length] = {pn:replies[i], __proto__:th.__proto__};
//          return posts;
//        },
        time: function(post){
return parseInt(brwsr.Date_parse(post.pn.getElementsByClassName('postdate')[0][brwsr.innerText]),10) + (pref.localtime_offset - site2['KC'].time_offset)*3600000;
},
        nof_posts: function(th){
          var nof_posts = th.pn.getElementsByTagName('table').length +1; // +1 for OP.
          var nof_files = th.pn.getElementsByClassName('filename').length;
          var om_info = th.pn.getElementsByClassName('omittedinfo');
          if (om_info[0]) {
            var str = om_info[0][brwsr.innerText].replace(/\n/g,'');
            nof_posts += parseInt(str.replace(/\ post.*/,''),10);
            nof_files += parseInt('0'+str.replace(/\ file.*/,'').replace(/[^\ ]*\ /g,''),10);
          }
          Object.defineProperty(th,'nof_files',{value:nof_files, enumerable:true, configurable:true, writable:true});
          return nof_posts;
        },
        nof_files: function(th){
          if (!th.hasOwnProperty('nof_posts')) this['nof_posts'](th);
          return th.nof_files;
        },
        sub:  function(post){return post.pn.getElementsByClassName('postsubject')[0][brwsr.innerText];},
        name: function(post){return post.pn.getElementsByClassName('postername')[0][brwsr.innerText];},
        pn_name: function(post){return post.pn.getElementsByClassName('postername')[0];},
        com:  function(post){
          return (post.pn.getElementsByClassName('postbody')[0] || post.pn).getElementsByTagName('p')[0][brwsr.innerText];
        },
        footer: function(th){return this.insert_footer4(th.pn.getElementsByClassName('file_thread')[0]);},
//        sticky: function(th){return (th.pn.getElementsByClassName('stickyIcon').length!=0);},
        flag: function(post){  // same as 8chan
          var balls = post.pn.getElementsByTagName('img');
          for (var i=0;i<balls.length;i++) if (balls[i].getAttribute('src').search(/images\/balls/)!=-1) break;
//          return (i<balls.length)? balls[i].cloneNode(false) : null; // may cause memory leak
          return (i<balls.length)? document.importNode(balls[i],false) : null;
//          if (i<balls.length) { // didn't stop memory leak.
//            var ball = document.createElement('img');
//            ball.setAttribute('src',balls[i].getAttribute('src'));
//            return ball;
//          } else return null;
        },
        op_img_url:function(th){
//          var img = th.pn.getElementsByClassName('file_thread')[0].getElementsByTagName('img');
          var ft  = th.pn.getElementsByClassName('file_thread');
          var img = (ft[0])? ft[0].getElementsByTagName('img') : null; // parse other site's html
          var url = (img && img[img.length-1])? img[img.length-1].getAttribute('src') : undefined;
          if (ft.length>=2) {
            th.op_img_url2 = [];
            for (var i=1;i<ft.length;i++) {
              img = ft[i].getElementsByTagName('img');
              var url2 = (img && img[img.length-1])? img[img.length-1].getAttribute('src') : undefined;
              if (url2) th.op_img_url2[th.op_img_url2.length] = url2;
            }
          }
          return url;
        },
        post_no: function(post){return parseInt(post.pn.getElementsByClassName('quotelink')[1][brwsr.innerText],10);},
      },
      'thread_html' : {
//        ths: function(doc) {return this.ths_array(doc, doc.pn.getElementsByClassName('thread_body'));}, // patch, but for what???, de-patched for trial.
        com:  function(post){return post.pn.getElementsByTagName('blockquote')[0][brwsr.innerText];},
        time_created: function(th){
return th.parse_funcs.time(th.posts[0]);},
        time_bumped: function(th){
return th.parse_funcs.time(th.posts[th.posts.length-1]);},
////        pop_post_prep: function(th){ // working code.
////          th.children = th.pn.getElementsByClassName('postreply');
////          th.idx_pop = th.children.length-1;
////        },
////        pop_post: function(th){
////          if (th.idx_pop>=0) {
////            th.post = {pn:th.children[th.idx_pop--], parse_funcs:this, __proto__:th.__proto__};
////            return true;
////          }
////          return false;
////        },
        proto: 'page_html',
      }
    },
//    catalog_json2html3_thumbnail: function(obj, board) {
//      var ext = (obj.ext==='.jpg' || obj.ext==='.png' || obj.ext==='.gif' || obj.ext==='.webm')? '.jpg' : obj.ext;
//      return (obj.ext)? 'http://i.4cdn.org' + obj.board + obj.tim + 's' + ext : '';
//    },
    catalog_json2html3 : function(obj,board,thumb_url) {
      var th = document.createElement('article');
      th.setAttribute('class','thread teaser');
      th.setAttribute('id','thread-'+obj.no);
      var post_flag = null;
      if (obj.flags && obj.flags[0]) {
//        post_flag = obj.flags[0].cloneNode(false);
        post_flag = document.importNode(obj.flags[0],false);
        post_flag.setAttribute('class','post_country');
      }
//      th.innerHTML = '<a href="http://boards.4chan.org' + obj.board + 'thread/' + obj.no + ((obj.sub)? '/'+obj.sub.replace(/ /,'-') : '') + '">' + // cause direct jump

        th.innerHTML =
//          '<article tabindex="0" id="thread_' + obj.no + '" class="thread teaser">'+
            '<article class="thread_OP" id="' + obj.no + '">'+
              '<div class="post">'+
                '<header>'+
                  '<a><h1>'+
                    ((post_flag)? post_flag.outerHTML : '') + 
//                    '<img class="post_country" src="http://krautchan.net/images/balls/kz.png" style="cursor:pointer" name="KC/catalog/01234567">/+
                        ((obj.sub)? obj.sub : '#'+obj.no )+ 
//                        obj.sub + 
                  '</h1></a>'+
                '</header>'+
                '<div class="post_body">'+
                  '<a>'+
                    '<div class="post_files multiple">'+
                      '<figure>'+
                        '<div class="thumbnail">'+
                          '<img src="' + obj.op_img_url + '">'+
                        '</div>'+
                      '</figure>'+
                      ((obj.op_img_url2 && obj.op_img_url2[0])? (
                        '<figure>'+
                          '<div class="thumbnail">'+
                            '<img src="' + obj.op_img_url2[0] + '">'+
                          '</div>'+
                        '</figure>'+
                        ((obj.op_img_url2 && obj.op_img_url2[1])? (
                          '<figure>'+
                            '<div class="thumbnail">'+
                              '<img src="' + obj.op_img_url2[1] +'">'+
                            '</div>'+
                          '</figure>'+
                          ((obj.op_img_url2 && obj.op_img_url2[2])? (
                            '<figure>'+
                              '<div class="thumbnail">'+
                                '<img src="' + obj.op_img_url2[2] + '">'+
                              '</div>'+
                            '</figure>') :
                          '')) :
                       '')) : '') +
                    '</div>'+
                  '</a>'+
                  '<div class="omittedposts">'+
                    '<span class="omitted_text">R: 0 / I: 0 / P: 0.0&emsp;/catalog/</span>'+
                  '</div>'+
                  '<div class="post_text"><section>'+
                    obj.com +
                  '</section></div>'+
                '</div>'+
              '</div>'+
            '</article>';
//          '</article>';
      var tns = th.getElementsByClassName('thumbnail');
      tns[0].childNodes[0].addEventListener('load',site2['KC'].catalog_json2html3_onload,false);
      return th;
    },
    catalog_json2html3_onload : function() {
      this.removeEventListener('load',site2['KC'].catalog_json2html3_onload,false);
      var w = this.naturalWidth;
      var h = this.naturalHeight;
      var f = ((w>h)? w : h) / 200;
      this.setAttribute('width', w/f);
      this.setAttribute('height', h/f);
    },
    favicon : {
      __proto__: site2['vichan'].favicon,
      none: '/favicon.ico',
      reply: 'png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAgY0hSTQAAeiYAAICEAAD6AAAAgOgAAHUwAADqYAAAOpgAABdwnLpRPAAAAKJJREFUOE9jZPh/hgECfv4yts59/PgxlAujZGVlzx6dzMDOBhMAaoCjtEA01SAuUBBZDQrnwEwsGoCCKBp+HEPwPx6QkZFB1gPifjyAUABUbGxsDLIUaAxEItQFxRIgFygIlAIqSAsEKYYDkGGhLpaWlsgaQNxQFxRrxcTEsLgbhxBI8SDUQLKnSQ9WUiOO9KRBfuL7cQzoH2C0oAGQJ5GcDQBwM6RhinByrgAAAABJRU5ErkJggg==',
      reply_to_me: 'png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAgY0hSTQAAeiYAAICEAAD6AAAAgOgAAHUwAADqYAAAOpgAABdwnLpRPAAAAMxJREFUOE9jZPh/hgECfv4yts59/PgxlAujZGVlzx6dzMDOBhMAavh/5j8MoKkGcdMCQYbCEYSFT8OBmagafhxD1iAjI4NsCYj78QBCA1CxsbEx0FKEDaEuKK4CcoFOAOoB2pMWCFIMAXANlpaWyBpA3FAXFGvFxMSQNWDxNJIQSDFEA5EAoQFfKGG1gQQNcP0gn4W6EPY0JFhBoQYJb8LBCo44KPp4gHDEoUQ70B5MgJ40kBMW0G2YAGviA9nz4xjQP8CQRgMgTyI5GwD2xdfU779fsgAAAABJRU5ErkJggg=='
    },
  };
  site2['4chan'] = {
    nickname : '4chan',
    home : site.protocol + '//boards.4chan.org/int/',
    postform: document.getElementsByClassName('postForm')[0],
    postform_comment: document.getElementsByName('com')[0],
    postform_submit: null,
    postform_rules: null,
    postform_activation : function(){
      document.getElementById('togglePostFormLink').getElementsByTagName('a')[0].click();
    },
    features : {uip_tracker: true},
    components: {
      boardlist: '.boardList'
    },
    pref_default: {
      catalog_expand_with_hr: true,
    },
    domain_url: 'boards.4chan.org',
    check_func : function(){
      if (window.location.href.search(/4chan.org/)!=-1) { // 4chan
        site.config('4chan.org','4chan');
        site.max_page = site2['4chan'].max_page(site.board);
        site.header_height = function(){
          var header = document.getElementById('header');
          if (header) return header.offsetHeight;
          else return 0;
        }
        site.whereami = (document.getElementsByTagName('head')[0].innerHTML.indexOf('404 Not Found')!=-1)? '404'
                      : (window.location.href.search(/catalog/)!=-1)? 'catalog'
                      : (window.location.href.search(/thread\/[0-9]+/)!=-1)? 'thread'
                      : (window.location.href.search(/\/$|(index|[0-9]+)(\.html)*|\/#all$/)!=-1)? 'page'
                      : 'other';
        if (site.whereami==='thread') { // || site.whereami==='page') {
          site.embed_to['top']    = document.getElementsByClassName('navLinks')[0];
          site.embed_to['bottom'] = document.getElementsByClassName('bottomad')[0];
//        } else if (site.whereami==='catalog') {
//          site.embed_to['top']    = document.getElementsByTagName('header')[0].nextSibling;
//          site.embed_to['bottom'] = document.getElementsByTagName('footer')[0];
        }
//        site.boardlist = document.getElementsByClassName('boardList')[0];
        return true;
      } else return false;
    },
//    catalog_background : '#ffffee',
//    catalog_bordercolor : '#f0e0d6',
    catalog_threads_in_page : function(doc){return doc.getElementsByClassName('thread');},
    catalog_posts_in_thread : function(doc){return doc.getElementsByClassName('replyContainer');},
    max_page : function(){return 10;},
    set_max_page: function (){return 10;},
    make_url4 : function(dbt){
      var url_prefix  = site.protocol + '//' + this.domain_url + dbt[1];
      var url_prefix2 = site.protocol + '//' + 'a.4cdn.org' + dbt[1];
      if (dbt[3]==='catalog_html') dbt[3] = 'catalog_json'; // catalog_html is a skelton.
      if      (dbt[3]==='page_html')    return [url_prefix  + ((dbt[2]!=0)? (parseInt(dbt[2],10)+1) :''), 'html'];
      else if (dbt[3]==='catalog_json') return [url_prefix2 + 'catalog.json'       , 'json'];
      else if (dbt[3]==='thread_html')  return [url_prefix  + 'thread/' + dbt[2], 'html'];
      else if (dbt[3]==='thread_json')  return [url_prefix2 + 'thread/' + dbt[2] + '.json', 'json'];
    },
//////////    make_url : function(board,no){return [site.protocol+'//boards.4chan.org' + board + ((no!=0)? (no+1) :''), 'html'];},  // worling code.
//////////    make_url3: function(board,th){return  site.protocol+'//boards.4chan.org' + board + 'thread/' + th;},
////////    make_url : function(board,no,key){
////////      var url_prefix = site.protocol+'//boards.4chan.org' + board;
////////      return (key==='p')? [url_prefix + ((no!=0)? (no+1) :''), 'html'] :
////////                          [url_prefix + 'catalog.json'       , 'json']; // 4chan's html is skelton.
//////////             (key==='j')? [url_prefix + 'catalog.json'       , 'json'] :
//////////                          [url_prefix + 'catalog'            , 'html'];
////////    },
////////    make_url3: function(board,th){return site.protocol+'//boards.4chan.org' + board + 'thread/' + ((th[0]!=='t')? th : th.substr(1)+'.json');},
    url_boards_json : function(){return [site.protocol+'//a.4cdn.org/boards.json', 'json'];},
    get_ops : function(doc){
      var ops = [];
      var threads = doc.getElementsByClassName('thread');
      for (var i=0;i<threads.length;i++) ops.push(threads[i].id.substring(1));
      return ops;
    },
    get_posts : function(doc) {
      var posts = [];
      var post_containers = doc.getElementsByClassName('postContainer');
      for (var i=0;i<post_containers.length;i++) posts.push(parseInt(post_containers[i].id.substring(2),10));
      return posts;
    },
    get_thread_link : function(pn,bn,del){
      var link = pn.getElementsByClassName('replylink')[0];
      if (link) {
//        if (del) link.parentNode.parentNode.removeChild(link.parentNode);
        if (del) {
          link.parentNode.removeChild(link.nextSibling);
          link.parentNode.removeChild(link.previousSibling);
          link.parentNode.removeChild(link);
        } else if (pref.catalog_open_in_new_tab) link.setAttribute('target','_blank');
        return link.getAttribute('href');
      } else return null;
    },
    modify_thread_link : function(pn){
      var link = pn.getElementsByClassName('replylink')[0];
      if (link) {
        var href = link.getAttribute('href');
        link.removeAttribute('href');
        return [[link, href]];
      } else return [];
    },
//    add_thread_link : function(doc,url){
////      <a href="thread/32599218/finland-general" class="replylink" rel="canonical">Reply</a>
//      var pn = document.createElement('a');
//      var prefix = new RegExp('https*://boards\.4chan\.org/[^/]*/');
//      pn.href = url.replace(prefix,'');
//      pn.className = 'replylink';
//      pn.rel = 'canonical';
//      pn.innerHTML = 'Reply';
//      var th = doc.getElementsByClassName('thread')[0];
//      if (th) {
//        th.insertBefore(pn,th.firstChild);
//        th.insertBefore(document.createTextNode('['),pn);
//        th.insertBefore(document.createTextNode(']'),pn.nextSibling);
//      }
//    },
    check_thread_archived : function(th){
      return (th.getElementsByClassName('archivedIcon').length!=0);
    },
//    get_time_of_posts : function(doc){
//      var posts = doc.getElementsByClassName('postContainer');
//      var last_post = posts[posts.length-1];
//      return [(parseInt(posts[posts.length-1].getElementsByClassName('dateTime')[0].getAttribute('data-utc'),10)- pref.localtime_offset*3600)*1000,
//              (parseInt(posts[0             ].getElementsByClassName('dateTime')[0].getAttribute('data-utc'),10)- pref.localtime_offset*3600)*1000];
//    },
    get_time_of_posts : function(th){
      var posts = th.getElementsByClassName('postContainer');
      return [site2['4chan'].get_time_of_post_in_utc(posts[posts.length-1]),site2['4chan'].get_time_of_post_in_utc(posts[0])];
    },
    get_time_of_post_in_utc : function(post){
      return parseInt(post.getElementsByClassName('dateTime')[0].getAttribute('data-utc'),10)*1000;
    },
    mark_newer_posts: function(th,date,unmark) {
      return site2['DEFAULT'].mark_newer_posts('4chan',th.getElementsByClassName('postContainer'),date,'border:2px solid red','border: none','class','post reply',unmark);
    },
    format_time : function(th){
      var times = th.getElementsByClassName('dateTime');
      for (var i=0;i<times.length;i++) times[i][brwsr.innerText] = site2.common.change_utc_to_local(parseInt(times[i].getAttribute('data-utc'),10)*1000);
    },
    remove_files_info : function(th){
      site2.common.remove_by_classname(th,'fileText');
      site2.common.remove_by_classname(th,'mFileInfo');
      var filethumbs = th.getElementsByClassName('fileThumb');
      for (var i=0;i<filethumbs.length;i++) site2.common.move_up_and_delete_parent([filethumbs[i].childNodes[0]]);
    },
//    remove_checkboxes : function(doc){
//      var cbxs = doc.getElementsByTagName('input');
//      for (var i=cbxs.length-1;i>=0;i--) cbxs[i].outerHTML = '';
//      return doc;
//    },
    remove_posts : function(th,end){
      site2.common.remove_by_classname(th,'postContainer replyContainer',end,true);
//      site2.common.remove_double_br(th);
    },
    absolute_link : site2['DEFAULT'].absolute_link.bind({protocol:'http:',domain_url:'http://boards.4chan.org'}),
////    absolute_link : function(doc,board){
////      var url_prefix = 'http://boards.4chan.org';
////      var protocol   = 'http:';
////      var all = doc.getElementsByTagName('*');
////      for (var i=0;i<all.length;i++) {
////        if (all[i].getAttribute('src')) 
////          if (all[i].getAttribute('src').substr(0,2)!='//') all[i].setAttribute('src', url_prefix+board+all[i].getAttribute('src'));
////          else all[i].setAttribute('src', protocol+all[i].getAttribute('src'));
////        if (all[i].getAttribute('href'))
////          if (all[i].getAttribute('href').substr(0,2)!='//') all[i].setAttribute('href',url_prefix+board+all[i].getAttribute('href'));
////          else all[i].setAttribute('href',protocol+all[i].getAttribute('href'));
////      }
////    },
////////    insert_footer : function(th,page_no,bn,exe,date,nof_posts,nof_files){
////////      var key = (!brwsr.ff)? 'innerText' : 'innerHTML';
////////      nof_posts += th.getElementsByClassName('postContainer').length;
////////      nof_files += th.getElementsByClassName('fileText').length;
////////      var om_info = th.getElementsByClassName('summary desktop');
////////      if (om_info[0]) {
////////        var str = om_info[0][key].replace(/\n/g,'');
////////        nof_posts += parseInt(str.replace(/\ post.*/,''),10);
////////        nof_files += parseInt('0'+str.replace(/\ image.*/,'').replace(/[^\ ]*\ /g,''),10);
////////      }
////////      if (exe) {
////////        var pn = document.createElement('div');
////////        pn.setAttribute('name','catalog_footer');
////////        pn.innerHTML = '<span>' + bn + '  ' + nof_posts + '/' + nof_files + '/' + page_no + '  </span>';
////////        var flags = th.getElementsByClassName('flag');
////////        for (var i=0;i<flags.length;i+=2) { // contains both mobile and desktop.
////////          pn.appendChild(flags[i].cloneNode(false));
//////////          pn.appendChild(document.createTextNode(' '));
////////        }
////////        var op_info = th.getElementsByClassName('postInfo desktop')[0];
////////        op_info.parentNode.insertBefore(pn,op_info);
////////      }
////////      return [nof_posts,nof_files];
////////    },
    format_thread_layout : function(th){
      site2.common.add_attribute_by_classname(th,'post op','style','padding:0px');
//      site2.common.add_attribute_by_classname(th,'file','style','float:left');
      site2.common.add_attribute_by_tagname(th,'blockquote','style','margin:12px 5px');
    },
    format_thread_contents : function(th){
      site2.common.remove_by_tagname(th,'input');
      site2.common.remove_by_classname(th,'mobile');
//      site2.common.remove_by_classname(th,'postLink mobile');
//      site2.common.remove_by_classname(th,'postInfoM mobile');
      site2.common.remove_by_classname(th,'sideArrows');
      site2.common.remove_by_classname(th,'summary');
    },
////////    thread2headline : function(doc){
////////      return site2.common.thread2headline(doc,'4chan');
////////    },
//    get_json_url_thread: function(board,thread){
//      return site.protocol + '//a.4cdn.org' + board +'thread/' + thread + '.json';
//    },
    get_json_url_catalog: function(board){
      return site.protocol + '//a.4cdn.org' + board +'catalog.json';
    },
    uip_check: function(callback){
      var url = [site.protocol + '//a.4cdn.org' + site.board +'thread/' + site.thread + '.json', 'json'];
      var key = site.nickname + site.board + site.thread;
      http_req.get('uip',key,url,callback,false,false);
    },
    parse_json_thread: function(obj,from_http){
      if (from_http) {
//        var obj = JSON.parse(txt);
        obj.posts[obj.posts.length-1]['unique_ips'] = obj.posts[0]['unique_ips'];
        return obj;
      } else {
        var obj = {posts: []};
        var uids = {};
        var nof_uids = 0;
        var posts = document.getElementsByClassName('postContainer');
        for (var i=0;i<posts.length;i++) {
          obj.posts[i] = {};
          obj.posts[i].no = posts[i].id.replace(/pc/,'');
          var id = posts[i].getElementsByClassName('posteruid')[0];
          if (id) {
            id = id.textContent;
            obj.posts[i].id = id;
            if (uids[id]===undefined) {
              nof_uids++;
              uids[id] = 1;
            }
          }
          obj.posts[i].unique_ips = nof_uids;
        }
//        obj.posts[posts.length-1].unique_ips = document.getElementById('unique-ips').textContent; // not refreshed.
        obj.posts[posts.length-1].unique_ips = 0;
        return obj;
      }
    },
    uip_tgt_post : function(no){
      return document.getElementById('pc'+no);
    },
    uip_post_num : function(tgt_post){
      return tgt_post.getElementsByClassName('postNum');
    },
    prep_own_posts_reg: /^4chan\-track\-[0-9A-z]+\-[0-9]+$/,
    prep_own_posts_event : function(e){
      if (e) site2['4chan'].prep_own_posts_1(e.key);
      if (window.name==='4chan') send_message('parent',[['OWN_POSTS', window.name, site3[window.name].own_posts]]);
    },
    prep_own_posts : function(bt){
      site3[this.nickname].own_posts = {};
      if (localStorage) {
        var keys = (bt)? [('4chan-track'+bt).replace(/\//g,'-')] :
                         Object.keys(localStorage || '{}');
        for (var i=0;i<keys.length;i++) this.prep_own_posts_1(keys[i]);
      }
//console.log(site3[this.nickname].own_posts);
    },
    prep_own_posts_1 : function(key){
      if (this.prep_own_posts_reg.test(key)) {
        var board = '/' + key.replace(/^4chan\-track\-/,'').replace(/\-[0-9]+$/,'') + '/';
        if (!site3[this.nickname].own_posts[board]) site3[this.nickname].own_posts[board] = {};
        var nos = JSON.parse(localStorage[key] || '{}');
        for (var j in nos) site3[this.nickname].own_posts[board][j.substr(2)] = null;
      }
    },

    catalog_native_prep: function(date,pn_filter,pn_tb,pn_hi){
      var node_ref = (site.whereami==='catalog')? document.getElementById('ctrl')
                                                : document.getElementById('ctrl-top');
//      pn_tb.setAttribute('style', 'float:right');
      site4.tb_prep_for_embed(pn_tb);
      if (site.whereami==='catalog') {
        var selector_native = document.getElementById('order-ctrl');
        if (selector_native.selectedIndex!=0) {
          selector_native.selectedIndex = 0;
          var evt = document.createEvent('UIEvents');
          evt.initUIEvent('change', false, true, window, 1);
          selector_native.dispatchEvent(evt);
        }
        selector_native.style.display = 'none';
        document.getElementById('size-ctrl').addEventListener('change', site2['4chan'].catalog_native_size_changed, false);
        var fl = document.getElementById('filters-ctrl');
        fl.parentNode.setAttribute('style','display:none');
        var qf2 = this.catalog_native_prep_clonenode(document.getElementById('qf-box'));
//        var qf = document.getElementById('qf-box');
//        var qf2= qf.cloneNode();
//        qf2.name = 'CatChan_qf2';
//        qf.parentNode.insertBefore(qf2,qf.nextSibling);
//        qf.setAttribute('style','display:none');
        var kwd_str = document.getElementsByName('catalog.filter.kwd.str')[0];
        if (kwd_str.value!=='') {
          kwd_str.value = '';
          pref_func.apply_prep(kwd_str,true,true);
        }
        qf2.onkeyup = function(){
          pref.catalog.filter.kwd.str = this.value;
          pref_func.apply_prep(kwd_str,false);
          kwd_str.onkeyup();
        }
        var qfctrl = this.catalog_native_prep_clonenode(document.getElementById('qf-ctrl'),true);
        qfctrl.onclick = function(){
          var qf_cnt = document.getElementById('qf-cnt');
          if (qf_cnt.style.display==='none') qf_cnt.style.display = 'inline';
          else {
            qf_cnt.style.display = 'none';
            qf2.value = '';
            qf2.onkeyup();
          }
        }
        var qfc = this.catalog_native_prep_clonenode(document.getElementById('qf-clear'),true);
        qfc.onclick = function(){
          qfctrl.onclick();
        }
//        var pn_tb_new = document.createElement('span');
//        while (pn_tb.firstChild) pn_tb_new.appendChild(pn_tb.firstChild);
//        pn_tb = pn_tb_new;
//        pn_tb.appendChild(pn_tb.removeChild(pn_tb.childNodes[3]).firstChild);
      } else if (site.whereami==='page') {
//        var pctrls = document.getElementsByName('postcontrols')[0];
//        for (var i=pctrls.childNodes.length-1;i>=0;i--) if (pctrls.childNodes[i].tagName==='HR') pctrls.removeChild(pctrls.childNodes[i]);
//        pctrls.parentNode.insertBefore(document.createElement('hr'),pctrls.nextSibling);
      }
//      node_ref.parentNode.insertBefore(pn_tb,node_ref);
      node_ref.appendChild(pn_tb);
//      node_ref.parentNode.insertBefore(pn_filter,node_ref);
      var selector_catchan = pn_filter.getElementsByTagName('select')['catalog.indexing'];
      selector_catchan.childNodes[0].textContent = 'Bump order';
      if (site.whereami==='catalog') selector_native.parentNode.insertBefore(selector_catchan,selector_native);
//      else pn_tb.childNodes[3].insertBefore(selector_catchan,pn_tb.childNodes[3].firstChild);
      return site2['4chan'].catalog_from_native(date,document,site.board,site.whereami+'_html');
    },
    catalog_native_prep_clonenode : function(node,deep) {
      var cn = node.cloneNode(deep);
      cn.setAttribute('name',((cn.name)? cn.name : 'clone_node') + '_CatChan');
      node.parentNode.insertBefore(cn,node.nextSibling);
      node.setAttribute('style','display:none');
      return cn;
    },
    catalog_from_native : function(date,doc,board,type) {
      return this.wrap_to_parse.get(doc, this.nickname, board, type);
    },
//    catalog_from_native : function(date,doc,board,type) { // working code.
//      var parse_obj = {domain:'4chan', board:board, parse_funcs:site2['4chan'].parse_funcs[type], __proto__:site4.parse_funcs_on_demand};
//      var ths = {pn:doc, __proto__:parse_obj};
//      return ths.ths;
//    },
    catalog_get_native_area: function(){
      if (site.whereami==='catalog') return document.getElementById('threads');
      else return document.getElementsByClassName('board')[0];
    },
    catalog_native_size: (document.getElementById('size-ctrl'))? document.getElementById('size-ctrl').value : 'small',
    catalog_native_size_changed: function(){
      site2['4chan'].catalog_native_size = this.value;
      var threads = catalog_obj.catalog_func().get_threads();
      for (var name in threads) site2['4chan'].catalog_json2html3_size_changed(threads[name][0].getElementsByTagName('img')[0]);
      catalog_obj.catalog_func().show_catalog();
    },
    parse_funcs : { // 4chan
      'catalog_html' : {
        ths: function(doc) {return this.ths_array(doc,doc.pn.getElementsByClassName('thread'));},
//        th_init: function(th) {
//          th.pn.getElementsByTagName('a')[0].addEventListener('click',th.parse_funcs.preventDefault,false);
//        },
//        th_destroy: function(pn, parse_funcs){
//          pn.getElementsByTagName('a')[0].removeEventListener('click',parse_funcs.preventDefault,false);
//        },
//        ths: function(doc) {
//          var ths = this.ths_array(doc,doc.pn.getElementsByClassName('thread'));
//          for (var i=0;i<ths.length;i++)
//            ths[i].pn.getElementsByTagName('a')[0].removeAttribute('href');
//          return ths;
//        },
        no : function(th){return parseInt(th.pn.getAttribute('id').substr(7),10);},
        time_bumped: function(th){return -1;},
        time_created : function(th){return -1;},
        nof_posts: function(th){
          var footer = th.pn.getElementsByClassName('meta')[0];
          var tmp = footer.textContent.match(/[0-9]+/g);
          if (tmp===null) tmp = [0,0];
          else if (tmp.length==1) tmp[1]=0;
          Object.defineProperty(th, 'nof_files', {value:parseInt(tmp[1],10), enumerable:true, writable:true, configurable:true});
          Object.defineProperty(th, 'footer', {value:footer, enumerable:true, writable:true, configurable:true});
          footer.innerHTML = '';
          return parseInt(tmp[0],10);
        },
        nof_files: function(th){
          if (!th.hasOwnProperty('nof_posts')) th['nof_posts'] = this['nof_posts'](th);
          return th.nof_files;
        },
        key: function(th){return th.domain + th.board + th.no;},
        sub: function(th){
          var ts = th.pn.getElementsByClassName('teaser')[0];
          var sub = (ts)? ts.getElementsByTagName('b') : null;
          var com = (!ts)? '' : (sub && sub[0])? ((ts.childNodes[1])? ts.childNodes[1].textContent : '') : ts.childNodes[0].textContent;
          Object.defineProperty(th, 'com', {value:com, enumerable:true, writable:true, configurable:true});
          return (sub && sub[0])? sub[0].textContent : '';
        },
        name: function(th){return '';},
        com: function(th){
          if (!th.hasOwnProperty('sub')) Object.defineProperty(th, 'sub', {value:this['sub'](th), enumerable:true, writable:true, configurable:true});
          return th.com;
        },
        footer: function(th){
//          if (!th.hasOwnProperty('nof_posts')) Object.defineProperty(th, 'nof_posts', {value:this['nof_posts'](th), enumerable:true, writable:true, configurable:true});
//          return th.footer;
          var footer = th.pn.getElementsByClassName('meta')[0]; // must parse pn because of mimic mode.
          footer.innerHTML = '';
          return footer;
        },
        sticky: function(th){return th.pn.getElementsByClassName('stickyIcon')[0]!==undefined;},
//        format: function(th){th.pn.getElementsByTagName('a')[0].removeAttribute('href');return null;},
        tn_as: function(th){return th.pn.getElementsByTagName('a');},
        tn_imgs: function(th){return (th.tn_as[0])? [th.tn_as[0].getElementsByTagName('imgs')[0]] : [];},
        class_thread: 'thread',
        class_thumbnail: 'thumb',
//        op_img_url: function(th){ // working code.
//          var img = th.pn.getElementsByTagName('img')[0];
//          return (img)? img.getAttribute('src') : undefined; // patch.
//        },
        op_img_url: function(th){return (th.tn_imgs[0])? th.tn_imgs[0].getAttribute('src') : undefined;}, // patch. // BUG IN MIMIC MODE, BECAUSE THIS REQURES TH.PN AND TH.PN WILL BE WRITTEN AFTERWARDS. // moved from DEFAULT.common
      },
      'catalog_json' : {
//        ths: function(obj) {return this.ths_json(obj);},
//        ths: function(obj) { // same as 8chan. // working code.
//          var ths = [];
//          for (var i=0;i<obj.obj.length;i++)
//            if (obj.obj[i].threads) for (var j=0;j<obj.obj[i].threads.length;j++) {
//              obj.obj[i].threads[j].page = i + '.' + j;
//              obj.obj[i].threads[j].sticky = obj.obj[i].threads[j].sticky===1; // overwrite property of the same name before setting prototype.
//              obj.obj[i].threads[j].type_html = 'catalog_html';
//              obj.obj[i].threads[j].__proto__ = obj.__proto__;
//              ths[ths.length] = obj.obj[i].threads[j];
//            }
//          return ths;
//        },
        ths: function(obj) {return this.ths_json(obj);},
//        ths: function(obj) {
//          var ret_obj = this.ths_json(obj);
//          for (var i=0;i<ret_obj.length;i++) {
//            if (!ret_obj[i].time_bumped) {
////              var p = ret_obj[i].page.split('.');
////              Object.defineProperty(ret_obj[i],'time_bumped',{value:(-1-parseInt(p[0],10)*60-parseInt(p[1],10))*1000});
//              Object.defineProperty(ret_obj[i],'time_bumped',{value:((ret_obj[i-1] && ret_obj[i-1].time_bumped) || -1)-1000});
//            }
//          }
//          return ret_obj;
//        },
        time_bumped: function(th){
          return (th.bumplimit)? undefined :
                 (th.last_replies)? th.last_replies[th.last_replies.length-1].time*1000 : th.time*1000;
        },
        time_created : function(th){return th.time*1000;},
        nof_posts: function(th){return th.replies+1;}, // same as 8chan
        nof_files: function(th){return th.images+1;},
        key: function(th){return th.domain + th.board + th.no;}, // same as 8chan
        sub: function(th){return (th.hasOwnProperty('sub'))? th.sub : '';},
        name: function(th){return (th.hasOwnProperty('name'))? th.name : '';},
        com: function(th){return (th.hasOwnProperty('com'))? th.com : '';},
        op_img_url: function(th) {
          return site2['4chan'].catalog_json2html3_thumbnail(th, th.board);},
        //        footer: function(th){return th.pn.getElementsByClassName('meta')[0];},
        posts: function(th){return th.last_replies;}, // can't show icon in desktop notification.
//        posts: function(th){ // work, but parse redundantly
//          if (th.last_replies) for (var i=0;i<th.last_replies.length;i++)
//            th.last_replies[i].op_img_url = site2['4chan'].catalog_json2html3_thumbnail(th.last_replies[i], th.board);
//          return th.last_replies;
//        },
        has_posts: true,
        last_replies: function(th){return undefined;}, // stop parsing loop between 'posts' and 'last_replies'
//        add_op_img_url: function(th){  // slow in chrome because of making needless prefetch.
//          for (var i=0;i<th.posts.length;i++)
//            th.posts[i].op_img_url = site2['4chan'].catalog_json2html3_thumbnail(th.posts[i], th.board);
//        },
//        add_op_img_url: function(posts,board){
//          for (var i=0;i<posts.length;i++)
//            posts[i].op_img_url = site2['4chan'].catalog_json2html3_thumbnail(posts[i], board);
//        },
        add_op_img_url: site2['DEFAULT'].parse_parts.add_op_img_url,
        time_unit: 1000,
        proto: 'catalog_html',
      },
      'page_html' : {
        ths: function(doc) {return this.ths_array(doc, doc.pn.getElementsByClassName('thread'));},
        th_init: function(th) {th.pn.removeAttribute('class');},
//        th_destroy: function(pn, parse_funcs){},
        no : function(th){return parseInt(th.pn.id.substr(1),10) || parseInt(th.pn.id.substr(2),10)},
//        ths: function(doc) { // working code.
//          var ths = this.ths_array(doc, doc.pn.getElementsByClassName('thread'));
//          for (var i=0;i<ths.length;i++) {
//            Object.defineProperty(ths[i], 'no', {value:ths[i].pn.id.substr(1), enumerable:true, writable:true, configurable:true});
//            ths[i].pn.removeAttribute('class'); // collection ISN'T writable? and if wrote, its enumerator doesn't work.
//          }
//          return ths;
//        },
//        no : function(th){return parseInt(th.pn.getElementsByClassName('postContainer')[0].id.substring(2),10);},
        last_replies: 'catalog_json',
        time: function(post){
          return parseInt(post.pn.getElementsByClassName('dateTime')[0].getAttribute('data-utc'),10) * 1000;
        },
        nof_posts: function(th){
          var nof_posts = th.pn.getElementsByClassName('postContainer').length;
          var nof_files = th.pn.getElementsByClassName('fileText').length;
          var om_info   = th.pn.getElementsByClassName('summary desktop')[0];
          if (om_info) {
            var str = om_info[brwsr.innerText].replace(/\n/g,'');
            nof_posts += parseInt(str.replace(/\ post.*/,''),10);
            nof_files += parseInt('0'+str.replace(/\ image.*/,'').replace(/[^\ ]*\ /g,''),10);
          }
          Object.defineProperty(th,'nof_files',{value:nof_files, enumerable:true, configurable:true, writable:true});
          return nof_posts;
        },
        nof_files: function(th){
          if (!th.hasOwnProperty('nof_posts')) this['nof_posts'](th);
          return th.nof_files;
        },
        sub:  function(post){return post.pn.getElementsByClassName('subject')[0][brwsr.innerText];}, // same as 8chan
        name: function(post){return post.pn.getElementsByClassName('name')[0][brwsr.innerText];}, // same as 8chan
        com:  function(post){return post.pn.getElementsByClassName('postMessage')[0][brwsr.innerText];},
        footer: function(th){return this.insert_footer4(th.pn.getElementsByClassName('postInfo desktop')[0]);},
        sticky: function(th){return (th.pn.getElementsByClassName('stickyIcon').length!=0);},
        flag: function(post){  // same as 8chan
          var flags = post.pn.getElementsByClassName('flag');
          return (flags.length!=0)? document.importNode(flags[0],false) : null;
        },
        op_img_url:function(th){
          var img = th.pn.getElementsByTagName('img')[0];
          var url = (img)? img.getAttribute('src') : undefined;
          return url;
        },
      },
      'page_json'  : {
        proto: 'catalog_json'
      },
      'thread_html' : {
        ths: function(doc) {return site2['DEFAULT'].parse_funcs['thread_html'].ths_array(doc, doc.pn.getElementById('t'+doc.thread));},
//        ths: function(doc) { // working code.
//          return [{pn:doc.pn.getElementById('t'+doc.thread),
//                   type_html: 'thread_html',
//                   page: '?',
//                   __proto__: doc.__proto__}];
//        },

//        pop_post: function(th){ // debuging code.
//          th.post = th.posts[--th.idx_pop];
//          return th.post;
//        },
//        pop_post_prep: function(th){
//          delete th.posts;
//          th.idx_pop = th.posts.length;
//        },
////        pop_post: function(th){ // working code
////          while (th.idx_pop>=0) {
////            var pn = th.children[th.idx_pop--];
////            if (pn.className && pn.className.indexOf('postContainer')!=-1) {
////              th.post = {pn:pn, parse_funcs:this, __proto__:th.__proto__};
////              return true;
////            }
////          }
////          return false;
////        },
//        post_no: function(post){return parseInt(post.pn.id.substr(3),10);},
        post_no: function(post){return parseInt(post.pn.id.substr(2),10);}, // 2015.05.12, maybe depends on baord???
        proto: 'page_html',
      },
      'thread_json'  : {
        op_img_url: function(th){return site2[th.domain].catalog_json2html3_thumbnail(th.posts[0],th.board);},
        tn_as: 'catalog_html.tn_as',
        sticky: function(th){return th.posts[0].sticky;},
        time_bumped : function(obj){return (obj.posts[0].bumplimit)? undefined : obj.posts[obj.posts.length-1].time*1000;}, // 4chan doesn't have email field.
//                   obj.posts[site3[this.domain].boards[this.board].bump_limit-2].time*1000 :   // for safety, 2.
        proto: 'DEFAULT.thread_json'
      },
    },
    popups_href2dbtp: function(href, src, th){
      if (href[0]!=='/' && th) {
        href = th.board+href;
        src.setAttribute('href',href);
      }
      var hrefs = href.split('/');
      var p = hrefs[hrefs.length-1].substr(hrefs[hrefs.length-1].indexOf('#')+1).replace(/^p/,'');
      var t = hrefs[hrefs.length-1].substr(0,hrefs[hrefs.length-1].indexOf('#'));
      var b = '/'+hrefs[hrefs.length-3]+'/';
      var d = '4chan';                                                                          // TEMPORAL
      return [d,b,t,p]
    },

    update_posts_remove: function(th_old,i,pnode){
      pnode.removeChild(th_old.posts[i].pn.parentNode);
    },
    update_posts_insert: function(th,th_old,i,pnode){
      var ref = (i==1)? (th_old.posts[0].pn.parentNode.nextSibling || th_old.posts[0].pn.parentNode) : 
                         th_old.posts[th_old.posts.length-1].pn.parentNode;
      if (!th.posts[i].pn) th.posts[i].pn = this.post_json2html(th.posts[i],th.board);
      pnode.insertBefore(this.post_container(th.posts[i].pn,th.posts[i].no), ref.nextSibling);
    },
    post_container : function(post_pn,no) {
      var pn = document.createElement('div');
      pn.setAttribute('id','pc'+no);
      pn.setAttribute('class','postContainer replyContainer');
      pn.innerHTML = '<div class="sideArrows" id="sa'+no+'">&gt;&gt;</div>';
      pn.appendChild(post_pn);
      return pn;
    },
    format_pn: function(){},
    add_backlinks: function(pn,backlinks,target){
      var bks = pn.getElementsByClassName(this.backlink_parent_class)[0];
      if (!bks) {
        var bks = document.createElement('div'); // why div???
        bks.setAttribute('class',this.backlink_parent_class);
        var ref = this.backlink_parent_prevSib(pn);
        ref.parentNode.insertBefore(bks,ref.nextSibling);
      }
      if (!target) bks.innerHTML = '';
      for (var i=(target || 0);i<backlinks.length;i++) {
        var href = backlinks[i].split('/');
        var post_no = href[href.length-1].substr(href[href.length-1].indexOf('#')+1);
        href[href.length-1] = 'thread/'+href[href.length-1];
        href = href.join('/');
        var blk = null;
        if (target!==undefined)
          for (var j=0;j<bks.childNodes.length;j++)
            if (bks.childNodes[j].textContent==='>>'+post_no) {
              blk = bks.childNodes[j];
              break;
            }
        if (!blk) {
          blk = document.createElement('a');
          blk.setAttribute('class',this.backlink_class);
          blk.setAttribute('href',href);
          blk.textContent = '>>'+post_no;
          blk.onclick = this.backlink_onclick;
          bks.appendChild(blk);
        }
        blk.onmouseover = this.popups_post_entry;
        if (target) break;
      }
    },
    backlink_onclick: function(){
      highlightReply.call(this,parseInt(this.textContent.substr(2),10));
    },
    backlink_class: 'quotelink',
    backlink_parent_class: 'backlink',
    backlink_parent_prevSib: function(pn){return pn.getElementsByClassName('postNum')[1];},

    post_json2html : site2['vichan'].post_json2html,
    post_json2html_file : site2['vichan'].post_json2html_file,
    catalog_json2html3_thumbnail: function(obj, board) {
      return (obj.ext)? 'http://i.4cdn.org' + board + obj.tim + 's'  // not 'obj.board' but 'board' is for thread_json.
                          + ((obj.ext==='.jpg' || obj.ext==='.png' || obj.ext==='.gif' || obj.ext==='.webm')? '.jpg' : obj.ext)
                      : '';
    },
    catalog_json2html3 : function(obj,board,thumb_url) {
      var th = document.createElement('div');
      th.setAttribute('class','thread');
      th.setAttribute('id','thread-'+obj.no);
      th.innerHTML = '<a href="http://boards.4chan.org' + obj.board + 'thread/' + obj.no + ((obj.sub)? '/'+obj.sub.replace(/ /,'-') : '') + '">' + // (cause direct jump) fixed.
//      th.innerHTML = '<a>' +
                       '<img alt="" id="thumb-' + obj.no + '" class="thumb"' + // cause popup error
//                       '<img alt="" id="thumb-' + obj.no + // don't load image.
                         ((obj.tn_w)? 'width="' + ((this.catalog_native_size==='small')? obj.tn_w*3/5 : obj.tn_w) + '"' : '' ) +
                         ((obj.tn_h)? 'height="' + ((this.catalog_native_size==='small')? obj.tn_h*3/5 : obj.tn_h) + '"' : '' ) +
                         'src=' + thumb_url + ' data-id="' + obj.no + '">' +
                     '</a>' +
                     '<div title="(R)eplies / (I)mages" id="meta-' + obj.no + '" class="meta">' +
                       'R: <b>' + obj.nof_posts + '</b> / I: <b>' + obj.nof_files + '</b></div>' +
                     '<div class="teaser"><b>' + obj.sub + '</b>' + ((obj.com)? ((obj.sub)? ': ' : '' ) + obj.com : '') + '</div>';
//      if (!obj.tn_w || !obj.tn_h) {
        th.childNodes[0].childNodes[0].addEventListener('load',site2['4chan'].catalog_json2html3_onload,false);
//      }
      return th;
    },
    catalog_json2html3_onload : function() {
      this.removeEventListener('load',site2['4chan'].catalog_json2html3_onload,false);
      if (!this.tn_w || !this.tn_h) site2['4chan'].catalog_json2html3_size_changed(this);
      this.removeAttribute('class'); // remove popup.
    },
    catalog_json2html3_size_changed : function(myself) {
      var w = myself.naturalWidth;
      var h = myself.naturalHeight;
      var f = ((w>h)? w : h) / ((site2['4chan'].catalog_native_size==='small')? 150 : 250);
      myself.setAttribute('width', w/f);
      myself.setAttribute('height', h/f);
    },
    favicon : {
      __proto__: site2['vichan'].favicon,
      none: '/favicon.ico',
      reply: 'png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAoUlEQVQ4T61TwRGAMAiTmexMDuVMOlM1XOEoAj60L20gDUlLy8dF6Kd+dM/TqTEmK6shAe4GW8zfQlLVMAGat2NVgr2dUDWJymomBRlJdUCoAEdbFZ7A4qEHw9jHCM5U/k1TiEyMkiqj8ikIgY1YCXxUUQp2NCW3F8malZno9kk9qKLKMKj4nwAScaGiETw2KRix8RWG5MhEjynB24usXusFrlPCCCmAi/UAAAAASUVORK5CYII=',
      reply_to_me: 'png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAvUlEQVQ4T61TXRrDIAiDXWmeabvTzlSvVGb8hFIK3ct8aeUnJkSZxmLZBF+/hBvHWLafRQDY6Wn5B3WKANUhrIkIADQF0Zqxt0NGbP5PACREDhXMDFZREr22g+Wn9VmTMnj3RlqwmKTNJYNfAGi8MPD61mAvEnzAZlDZmA0xs7q08Q7AW5wCVC54aWaxl4A5qFWVCyE+DF830Tf7Kd/ZCBb/BwBFyMgkxNyJgVKFv5CTXeWYM4DqLsTHlD33Lx2GzAg15eTiAAAAAElFTkSuQmCC'
    },
  };
  site2['lain'] = { //lainchan.org
    nickname : 'lain',
    home : site.protocol + '//lainchan.org/q/index.html',
//    home : site.protocol + '//lainchan.org',
    protocol: 'https:',
    domain_url: 'lainchan.org',
    postform_submit: null,
    postform_rules: null,
    postform_activation : null,
    features : {page: false, graph: false, setting2: false},
    pref_default: {
      page: {colorID_native: false},
    },
    boards_json:{boards:[{board:'cyb'}, {board:'tech'}, {board:'\u03bb'}, {board:'zzz'}, {board:'drg'}, {board:'lit'}, {board:'diy'}, {board:'art'}, {board:'w'}, {board:'rpg'}, {board:'r'}, {board:'layer'}, {board:'q'}]},
    check_func : function(){
      var href = window.location.href;
      if (href.indexOf('/lainchan.org/')!=-1) {
        site.config('lainchan.org','lain');
        site.max_page = 7;
        site.header_height = function(){
          var header = document.getElementsByClassName('boardlist')[0];
          if (header) return header.offsetHeight;
          else return 0;
        }
        site.whereami = (href.indexOf('/catalog.html')!=-1)? 'catalog'
                      : (href.indexOf('/res/')!=-1)? 'thread'
                      : (href.search(/\/$|(index|[0-9]+)\.html|\/all$/)!=-1)? 'page'
                      : (document.getElementsByTagName('title')[0] && document.getElementsByTagName('title')[0].textContent==='404')? '404' 
                      : 'other';
        site.myself = (site.whereami==='thread')? parseInt(href.replace(/.*res\//,'').replace(/\.html/,''),10) : 0;
        if (site.whereami==='thread' || site.whereami==='page') {
          site.embed_to['top']    = document.getElementsByName('postcontrols')[0];
          site.embed_to['bottom'] = document.getElementsByTagName('footer')[0];
        } else if (site.whereami==='catalog') {
          site.embed_to['top']    = document.getElementsByTagName('header')[0].nextSibling;
          site.embed_to['bottom'] = document.getElementsByTagName('footer')[0];
        }
        if (site.whereami==='thread' || site.whereami==='page') {
//          site.postform = document.getElementsByTagName('form')['post'].getElementsByTagName('tbody')[0];
          site.postform = document.getElementsByTagName('form')['post'];
          site.postform_comment = document.getElementById('body');
          this.postform_prep();
//          site.postform_submit = document.getElementsByTagName('input')['post'];
//          site.postform_submit2 = null; // same as 8chan.
//          site.postform_submit2_observer = new MutationObserver(this.postform_submit2_find);
//          site.postform_submit2_observer.observe(document.getElementsByTagName('body')[0], {childList: true});

//          var bar_bottom = document.getElementsByClassName('bottom')[0];
//////          site.root_body2 = bar_bottom.insertBefore(document.createElement('span'),bar_bottom.childNodes[1]); // working code.
////          site.root_body2 = document.getElementsByClassName('pages')[0];
////          site.root_body2.setAttribute('style','width:auto');
//////          site.root_body2 = document.getElementById('style-select');
        }
        pref.thread_reader.own_posts_tracker = true;
        setTimeout(function(){this.postprocess_board(this.boards_json)}.bind(this),0);
//        site.boardlist = document.getElementsByClassName('boardlist')[0];
        return true;
      } else return false;
    },
//    catalog_threads_in_page : function(doc){return doc.getElementsByClassName('mix');},
    catalog_posts_in_thread : function(doc){return doc.getElementsByClassName('replyContainer');},
    max_page : function(){return 10;},

    catalog_native_prep: function(date,pn_filter,pn_tb,pn_hi){
//      var node_ref = document.getElementsByClassName('catalog_search')[0].nextSibling;  // FF doesn't work.
      var node_ref = (site.whereami==='catalog')? document.getElementsByClassName('threads')[0]
                                                : document.getElementsByName('postcontrols')[0];
      site4.tb_prep_for_embed(pn_tb);
      if (site.whereami==='catalog') {
        var selector_native = document.getElementById('sort_by');
        if (selector_native.selectedIndex!=0) {
          selector_native.selectedIndex = 0;
          var evt = document.createEvent('UIEvents');
          evt.initUIEvent('change', false, true, window, 1);
          selector_native.dispatchEvent(evt);
        }
        selector_native.style.display = 'none';
        document.getElementById('image_size').addEventListener('change', site2['lain'].catalog_native_size_changed, false);
        var pn_tb_new = document.createElement('span');
        while (pn_tb.firstChild) pn_tb_new.appendChild(pn_tb.firstChild);
        pn_tb = pn_tb_new;
        pn_tb.appendChild(pn_tb.removeChild(pn_tb.childNodes[3]).firstChild);
      } else if (site.whereami==='page') {
        var pctrls = document.getElementsByName('postcontrols')[0];
//        for (var i=pctrls.childNodes.length-1;i>=0;i--) if (pctrls.childNodes[i].tagName==='HR') pctrls.removeChild(pctrls.childNodes[i]);
        pctrls.parentNode.insertBefore(document.createElement('hr'),pctrls.nextSibling);
      }
//      node_ref.parentNode.insertBefore(pn_hi,node_ref);
      if (site.whereami==='catalog') node_ref.previousSibling.appendChild(pn_tb);
      else node_ref.parentNode.insertBefore(pn_tb,node_ref);
      node_ref.parentNode.insertBefore(pn_filter,node_ref);
      var selector_catchan = pn_filter.getElementsByTagName('select')['catalog.indexing'];
      selector_catchan.childNodes[0].textContent = 'Bump order';
      if (site.whereami==='catalog') selector_native.parentNode.insertBefore(selector_catchan,selector_native);
      else pn_tb.childNodes[3].insertBefore(selector_catchan,pn_tb.childNodes[3].firstChild);
//      pn_tb.childNodes[0].setAttribute('style',pn_tb.childNodes[0].getAttribute('style')+';display:none');
//      pn_tb.childNodes[1].setAttribute('style',pn_tb.childNodes[1].getAttribute('style')+';display:none');
      return site2['lain'].catalog_from_native(date,document,site.board,site.whereami+'_html');
    },
////    catalog_native_size: (document.getElementById('image_size'))? document.getElementById('image_size').value : 'small',
////    catalog_native_size_changed: function(){site2['lain'].catalog_native_size = this.value;},
////    catalog_get_native_area: function(){
////      if (site.whereami==='catalog') return document.getElementById('Grid');
////      else {
////        var pc = document.getElementsByName('postcontrols')[0];
////        return pc.insertBefore(document.createElement('div'),pc.firstChild);
////      }
////    },

    catalog_from_native : function(date,doc,board,type) {
      return site2[this.nickname].wrap_to_parse.get(doc, this.nickname, board, type);
////      var parse_obj = {domain:this.nickname, board:board, parse_funcs:site2[this.nickname].parse_funcs[type], __proto__:site4.parse_funcs_on_demand};
////      var ths = {pn:doc, __proto__:parse_obj};
////      return ths.ths;
    },
//    catalog_get_native_area: function(){return document.getElementById('Grid');},
    catalog_native_size: (document.getElementById('size-ctrl'))? document.getElementById('size-ctrl').value : 'small',
    catalog_native_size_changed: function(){this.catalog_native_size = this.value;},
    parse_funcs : { // lainchan
      'catalog_html' : {
        sticky: function(th){return false;}, // patch
      },
      'page_html':{
        tn_imgs: function (th){
          var imgs = [];
          var files = th.pn.getElementsByClassName('op')[0].getElementsByClassName('file');
          for (var i=0;i<files.length;i++) imgs[i] = files[i].getElementsByTagName('img')[0];
          return imgs;
        },
      },
      'catalog_json' : {
        time_unit: 1000,
      },

    },
    colorID: function(pn) {
      var id = pn.getElementsByClassName('poster_id')[0];
      if (id && id.style && !id.style.backgroundColor) {
        site2['vichan'].colorID(pn);
        var prev = id.previousSibling;
        id.textContent = 'ID: '+id.textContent;
        if (prev.textContent===' ID: ') prev.textContent = '';
      }
    },
    catalog_json2html3_thumbnail: function(obj, board) {
      return (obj.ext==='.jpg' || obj.ext==='.jpeg' || obj.ext==='.gif' || obj.ext==='.png')? 'https://' + site2['lain'].domain_url + board + 'thumb/' + obj.tim + '.png' :
             (obj.ext==='.pdf')? 'https://' + site2['lain'].domain_url + '/static/pdf.jpg' :
             '';
    },
    catalog_json2html3 : function(obj,board,thumb_url) {
      var th = document.createElement('div');
      th.setAttribute('class','mix');
      th.setAttribute('style','display: inline-block;');
//      if (obj.ext==='.gif' || obj.ext==='.png') obj.ext='.jpg';
      if (obj.ext==='.gif' || obj.ext==='.jpeg') obj.ext='.jpg';
      th.innerHTML = '<div class="thread grid-li grid-size-' + this.catalog_native_size + '">' +
                     '<a href="' + thumb_url + '">' +
                       '<img src="' + thumb_url +
                       '" id="img-' + obj.no +
                       '" data-subject="' + obj.sub +
                       '" data-name="' + obj.name +
                       '" data-muhdifference="" data-last-reply="" data-last-subject="" data-last-name="" data-last-difference=""' +
                       'class="' + board + ' thread-image" title="' + new Date(obj.last_modified*1000).toLocaleString() + ' '+obj.ext + '"></a>' +
                     '<div class="replies"><strong>R: ' + (obj.nof_posts-1) +' / I: ' + obj.nof_files +
//                     ((pref.catalog_footer_show_board_name)? ' '+board : '')
                     '</strong>' + 
                     ((obj.sub)? '<p class="intro"><span class="subject">' + obj.sub + '</span></p>' : '<br>') +
                     obj.com + '</div></div>';
      return th;
    },
    catalog_from_json3 : function(obj,board) {
      return site2[this.nickname].wrap_to_parse.get(obj, this.nickname, board, 'catalog_json');
////      var parse_obj = {domain:this.nickname, board:board, parse_funcs:this.parse_funcs['catalog_json'], __proto__:site4.parse_funcs_on_demand};
////      var ths = {obj:obj, __proto__:parse_obj};
////      return ths.ths;
    },
    favicon : {
      __proto__: site2['vichan'].favicon,
      none: '/favicon.png',
      reply: 'png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAYAAADimHc4AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7DAAAOwwHHb6hkAAAAB3RJTUUH3wUcDCkWRBuw0wAAIABJREFUeNq8vXewZdl13vfb+8Sb08upX+ecZzABGASRAAkBAkGAGJCURMlVUsk0JZctV0muUpU4Fs2SXKLKLtM2y4ogZZkiAAJiFAGYCDMYzCBM6DDd09O5X84335P23v7j3Hf7dU/3YAYYale9evGec+5ee6/1rW99az9hjOG/5BBCSMACDKCMMUYIYcE+G65ZgEWpZBPZWSyKhD0fsImNJOOAEDFJEkMcI2VAsdgjikKk1GxamnFbs7SkALXj+hKQgNh53/ueS/S/lP3PGo44sOZCN4cTjWHiYSQ5FAphN7CyS2TkOvV6CJ+J4Aumfw9t3ubEir9oA/Tf2PYH/Qkwg58NH83QXJlA9WYw0TgqHkJSllAEshY4loUlQCrdnzxFgkRriA30gK7WdJCyhbDrCLGOtFeIxBK0631jwDPPwDPPmPsm+t7nSb+GajVPMz6J7hy30bNSMOxaFABHgNGGIFJsxZoFLPcNnOz3COpzqeGQ29f9YYb4kQywY1K5b2LZedP7/g5jjBZCSAqTFYKtXcThhMRMgd7lWcxIwdDs7l3HC7nceBJHKKUQGKQAYwzGwD32FAJhWdi2jRAyqjcb83fm597Qmi0MawoWVcKCwtrEcTewSitUJlfN4g+628/3zDOIZ5655/kKOM5h4visK3mPZ3Fw3749j6ITW27byoBGgLTYqjfmlte3LkQJL2ns58F/BdrrO9/zu2aA+yf0LYbZaZi+G/AhU8NJJon1QVuqU5bgQMa2pmZ3TR9xLFxbChxb0j11kB987p+8rWeqvHyZiS9/ndqffxfdCUiUQRkDWDTa7bWlpZVriWY1MdxRcE1r3sB1F5G5Otlanf/2r7XNr/6q7r+3Kpb1uFTqL2ccntg3M3m8mPPs5859/qH3/8CZn6cbxFy5dvuNIOF8ZKw/JON+nV5vub8beKtd8LYNcN/kp8uAD1mwKjkCXLqU9FfQfUY6YsOlAo6zD6Xe4wh9xhXsnpkaP1rKZ4ZsATKf4dnv/Pa76vqe/OivYC+toY1ACAvpuFy4ePHFKGE1NMzFSl7Hdi6TiCuU/S3qyobuB12pns454tTBvTP7l//h3+TWL/2Vt3W/p048zdJGvXFnafPFyDifB/dPoLN2v1f4kQywY1LTlX3kiM3iYpaeHiJUWVzXYAV1er0NINy2PIxmYWs3qMc9qR51LY4c3L/3vULHwndt3mplvZvjA6c/S73VIYhipHTIF4pcvfLGt2OYDxVXEmFdRXp5N+n+5Egl+9S+6bHRb75699meOvVZokihDSAMAvA9h2df+Y/33OeDZz7L4lqjd3tp/blQWf83qK8Dje25e5ARfqgB7pt8CQyDvQfMbomaBgpINJoNATeV614him4BGeCkLfmQZ/H+3VPjj2U9J6MfO/a23cu7Nc4c/DStXg9tNBiDJQSuZWE7DkGcrLi5UrPVDbwk7I5XM5Zz7vofD177+PGnSTT4GR/P8zEYgiAk6PVwJHz34hfuNfZ7f4k3Ll5f22iHX4u0/X/ywfd9j29+Uz9sJ7ylAXZAMwAPtzBL1HrSlbzfluydHB/d33rmvx5FCPR/98+udLrB7VDznUTa38CYUQf1Cd/ikf2zU4cKGZdvvfp5/kuPw7s/QaMTIi0bKQVaK7RKcC0oZlzyWZ9EGzYaHYIooZTPUinl0UYTRppqrcLM9ASjw1Vy2SwGaLa73J5b5NateeKgyytXvnSfO/oMr75+82ZH8a+0V/339DYXHwZPH2qA7cnvB9AMjnOCOP7LGYsPTYxUHrWF8V1HIqUEY0iShMRYzK1uvtaNOYcQwznfeSLnyPz0WI2XrvzBjzSBu37njxn++vdxVzaxm60B8EpKeRqPHOG1f/LLb/n6sdpPEiaGYiGHlDJ9Tq0QxlDMugyXszz3yn9k12//IRO/8R/ohjGtbo8gShiqVfngex/h0dNHqBTzCCHQCKIoZnVji3OvXeXlVy8i4pDvvnbvTji++2O8MbfyZyHWb6LUV3bA3XuC8gMNcK/bmfVg4bhE/XXf0h+fGC7tvrb05/f8fXZxle7ECAC14lO0Iw0Ysq5DIZtFSMNQOcdLl37/LSd69n/7DyhtUMqgjUmh5zbSFf3PZoBABxhYIpASLClJxmt8509/c4CQqp/4H+jGmlwmg+vYCCEwBjq9gFa7QzHncmvhP9/zLKcPfoq1epvRkWE+8N7TnDl+iEq5lF4/UQghyGRcNraa/PlzP+D5F1+iknV49pXfvQed6Sf/+q1WzL/Tuvy/Q307FtwDTd9kgDclTq57lCj5W77QP3tw99jUTv94/zi062PcWdlCIyjksuRzWbQytDodaiWfq7f/5J6/P/qPf4vSl79JEMVESoOQOK6N5/lkfY+M7+P5Hq7rYlsSKQUCgTYGpTRRHNELQnq9gF4vJAgC4jgCo/Fdm5zv0g0iljbbBJEi6/t4noOU6c6tN9ooFXNwZpjndkze9jh7+OcIlWHvnhmeeOQkB/ZO49g2qm8Ez3NZ3dji//3SV1hbXuKlS1+85/XH9nyMa/MrXwjI/Avi3svbCeFOA9hvjeX9KRlFf8WT+q/MfOpDU+e+8M9Tvzr7caIkAQSuY+HYFq1OwHy9jeu5lAsFstkMBuh0AixLUs5n+pP+f+H87lfoRQnCcRGlAtMT4wwNVRmqlKiUChTyOTIZD891sS0bKSVaK5RKkUhqBI1SiihJCMPUEK1Wh81Gg7WNBmvrm9TrDXrdEHSCNJooComTGK3TRRclipxnc+e//6sPnICXLn+RJ098lmtXb7K6tsUjp4/y5CPHKJfy9IKYOEmolkscPrCHjfV13nfys3z73O8NXp/3XRzJRJAkh2D8Aiwl9+dR9gNX/zPPwOc+57K4+H5b64/vnhiavfSFf87Yv/4ypV//NxRKeUZqZXIZn6XVTW7Nr7K22UQjKBazeK6HVpoojlEqwreh1ws4ffBnQdoUKjUOjY8wOlKlWi6Rz2fJ+B62bSGRqe/ThjCK0LYh63uUSwVcz0FpTRLru/7HpO5KaU2cJPR6Ac12l/XNJiur66ysrrO0ssri0hqNRhvLlhSyfroLhKBcyPLiL338oavwO+d/jzN/81dpf/scL3zvFdqdDk8+coLJ8WEEgkQpZibHyGazdBpb97zWqxSYmZo6fPn28rRmyerH04cbYGCdZ54RuO5+mUQ/OVTOnrh0+88ofO81yr/+b5mcGOXk4VlmxoYA+MZ3L7KwvEG5kCXRKWUQRimN0At6GJVQLmaxPZ9SucT05AT7dk9Tq5RSSBeGNFtt5uaXabQ6tDo9giAkUSl94zoOxXyW8ZEhdu+aYGykNvDjYPqxQCCEwLIkxUKOSqnArskxonCWjXqTWwtLvHHtDjdvzbO1tYUjoVzI3rNa32q8/Ln/qQ9nf5bvfv883W7IU4+fYs+uCRzbplTI4fs+zfq97vxbz/8Ojxz/+SpJUoKytc1HCSHEdiC2HwA5DUNDOdY3P5ixOTE8PpxdBMY+/Q/Yv3+GR0/uZ2q0htaay9fnmV9ep5z3WXjh37H/g3+HeruHSkKSJAGjKBTyzMxMcfjAbvbvnWZiZIggjHnp/Ou8fv026xt1ut0eYRSRJAqlU84H0U+2EUgBnuty5OAefuJ9Z9kzO4lBoJW6JzlXSqM0JEYjhEBIyVC1RKVSZN/sNLfuLPHyhde5eu0mnSB6x4js5Stf5skTn+X8xct0ej0+8sHHOLR3Fznfw3Fs9AMApdEaKXG1NmJACO4g/ew3rX4QtFrDjtSP7pudOnXu4u9zcv8nOTf3J3z6l/8pU2NDCCFZXt3k++evkUQR5658GYAL177M+87+AisrW/SMYGpyipPHDnFw7wyjIzWGqmXqjRbf+cEFnn3xFbrdXgoplQJjEFJgWVY6eYLUECY1RKvT5fIbNxiulZiZGsNzXSKtuTdPNBi9jfU0CLCExLEsKqUC2QMetWqR8dEhXjl3iWP7fob5z/8z6mcOv20jfOf87/Hek5/l1q07fO2bYFsWtT5CehCitKQEiKDxQLx/vwE0kCHhkGOxR40WxXaw+quf+PuMnzqA59gsrW3xyqWbrK3XKU+P3HPBsBuSyeU4MD3JyaMH2L9nhmq5iGNbOLbNwtIa33/1EiurGxRyWXzfTR9cpEynQNxd/UJgSYkUknAtotXp0ukF21s2hWri7rpJ2VJ2fG/QGHQftfiuy67JMQq5HBnf4/svX4Cn/0fq195ZjvL8ud/jyRNPMzc3zzee/wH7ds/Q6XRxLeteauL008xtNOYTLTdAKyGE+AyILwyomruc+D2wHhUe9ixqF7/9O6kVLcnYSJV8JkM3CLh+Z4k3bi5QyLq88Oy/upu2H/sMMRaHDu3jg+99lEdOHGakVkFKgVIKlSha7Q5b9Sa+56WB17KwLDmYaCEElpBYloUlJVprOr2ARClGhqrMTk9gWRZaax4Aod/00Yd9aK2JlUJrQ61S5LEzR3niPScpViqc3P+z79gdfef85yl4Dlev3uQbz7/E+sYWuYx7z9+0uwEr6xvXseybMJWQTv49idg9BjDGGDKZjJTMjvzMhw8NtpFjk8/62LbkztI6r1+fJ4kivrcj+3v82NN0Yjh0aD9PPXaag3tnyGR8lFbEcUKcKMDgeS7ZjI8l+9lU39WkHwbTT8RUogmDiFa7S6vdoVYr8+ipIxw9uBspBHrgft6Sx0IIgZSyH7gNcZKQKEWpkOPsiUM8duY4luvx+LGn37ERnnv1d8nYgrm5BRqNJmT9e37fjRSR5haK12A+vqfg8wADpL/Q2rEFQ87iKgCF778G/a3d7PR4/foCSysblKdHBy9874nP0ksMBw/u4QNPnmH/nmls26IXBCSJRgg5yF5r5SKT48P0wohur4fWeucCQGlNGMd0ugHdXoAQgsnxYd77nhM8cfYYQ9VyP0smpUHefi1jkIAliaYXRJSLBR45eZgjh/fTjhIe/+m/+46N8MKFz1MrZNBa091qDX7+vhOf4c7CysVI8TJEt/vu3fxwA4ShADyr3gSg9ehRlFJs1dtcujrH7fkVPEvywrP/GgB/fpVGL2Zm1xQffv97mJ0aI4kVYRj133AaUDGQKEOtWubY4X2USwXCMKbbDQjCkF4QEoQRQRgSRTFCQKlU4PDB3fz0h57gw089yvTkKEmi7vP177ia1yflDEEYUykXee97TlIbqhHdXvqRrnn+2h9QzGfZanb54CNpUnftztJ6N+ZFnMyL8JnuwwpZ9wdhA2hlCHfaxijNhat3aLZ76Djm3I6gtfepv83o1Djvf+I0u/oTFMXqHh8M6WqNkwTf9zh1dD/1RpPvv3qZzc0GJkk5H8uS+J5LuVRkanyEA3um2bt7itGhKq5jEycKbcwPdT1vzwgQJwmWJZkaH+HUsUM8/+IPePLE03zn/DtnbS9c+08c3fsz3F5c5/i+n+H1ZnBZW+6fUc5fYu0L5mF09IOoiNjAWtzqBYAPIKZHeP3ybVzXofjJD9zj9+NcjrMnj3Bk3yyJUkRxghDpyr//TWut0VpTLRX4wBNnmBgdZmFplW43wGDIZNKMd7haZWS4wlClSDaTAWMI4xilTerP3x2xAFIIVKKwbZtjh/Zy5dpNFufmf+Rrek+dZvOPvsVavbMRG/nHqOh5s7raTlUfD1ZK2PcxEYJSqaPb3Qt35hevnZz96WPnbv0Z63/9Y4R//39lpFLg1f/jHw5eUO+GvOfsIU4c3ottW3S6wWCLP2jIPqoxRjAyVGWoWqbT6dELQoxJA3Qu6+N7LkIIkiQhCEO0Tle99Q58/tsZUkq0MSSJYmy4yvTkGKvLK5Rfukz97OF3fL2XP/cMx/d+nHbYirHsG6ioLn7IdpVvoiIajRZKvNBLuLzebDcBKr/+bxiuFnl1R+HhsWNPU66UOXl0P7VKkV4QvsntPGzlGZNWlZJEkc34DNfKDA9VyOezgKDbC2m1u/SCqA8178LJ7Y93a2xfz3VspsdHKRQKHPhr/+hHvt6F639MwTVIlZzFK07fF3Pf0gDmriApuqWwvrjVCl4cH/pLtDoBI7XSfRAr4ciBvUyMDQMC1V+lDzKA2fFGd75xrfXAbcVxQhJvM556O9e65/l3GkDv+PrHNYpBY4xmqFamVCwQxPGPZdS9MxNjrq0/TNg5DfvdPgISD9oNDzIAQA/UN7sJf+plCpuOFHz7pf9wV3Fw4rN4mQyH9u8il/WJE/W2Jl9rjVIabczdYopI6QfHtvE9h4zvkcv45HMZshmfTMYnm/HwXRfXsbEtC9nnKQbX6ydlP6oRjAGlNYVchnw+i9I/3q567tX/SK2Q2etI9SGcpcPwzEPdgr0zCRPb1GJajtjCerXuea4q5iQ3d0ZppRmZGGJ8tIZlWURRnE7KjqGNwehUyialHGS80pL3ZagGpQ2J0ug4Xf3a3F0PabBMM2XLkti2hZBO3whgjEbptDaQfjZ9llS8rTxh8Cza4Lkuvu/96Bh3x5idHC3X27cejVXvFXjmSl8tIvou2LwVHZ3ePXNpRPbUARW2ve9fu1uyO/Er/xSEYHpihHw225+EFJ3cuwpFn04QSGkhAIUhimKiKCaM4hT7ByFBEBFGIVEcp4yo6sNN0kl0bAvXdfE8F99zyfgeGc/D8/q7wrawbAvLWOi+UbcR186M+IcpyaSUWJb9rhjg+Qtf5ODMR4/fWFg7G+M+C09eg2/q+7Nh+yHyExclHnVtzhYybnHnhXPPvgSux8ToELZtDdzJ9sRvv1lLWlhWP+CGEc12h61Gk816k3qjRavVodPp0usFRGFEHCeoJEH3XdTd60ksS2DbNrbj4HrpKs3nshQKOcqlItVKkUopTyGfw/c9HEeitUQlehBPdj7fg7cCGPr3NeJdCfDFnOd6DkfjxDyG+uad1LWnseBN9YB7R74ok/aTlYJ36PLX/+W9SYIy5PM+tUopXdXaDPy8lALbsrEsSRTHbG62WV3fYmVtk7W1TTY267SaLbrtHnEYksRJyun3iXRhdqSLYnsizHZZACPu1YO6vksmm6VYylOtlhgaqjA8XGOkWqZczJPxPcAiSRSJUgNh0/1GMP2fqUQRx/H2HX/s8f3L/4mDuz56/Nr82mOKzP8H21TufTFgx+rXzM56zC8fdOHk+Eht19LU6Jt8u+/7qUbGpDobKSS2nfr2OEnYqHdYWF7l5u1F5uaWWV/doNPuYJIEaQyOSN2KLyW2bWP1yTJJSlsIIfpzb/rlgLtIR2lDojVJkhA1QrqbTVYXQDgWmXyWWq3K5MQoM9NjTI2NUKkU8Fw3LZj0g/Y2tJVS9KlwgSUE3SCk2w0QvHswt+B7RVdyuCf1EZLxLVjq7YwF9n0aIS0KhSI6edK3mfBGqg/YqQLXcXEdZ1AStPqBtdXucmd+mfOvX+fqjds0NupYcYINZC2J67qp1txKA+o2/Sz63H569VRca7aLGdsxRexgTHf4+UQpYqWIlCKut1iot1mcW+LylQKTk2Ps3zvN3tkphmtlHNtJF5HSfaOm15SCvkqiRbPVwrXevYTP3jWOf3t+pBfGj5FtXDQd0+33K9zjggTQb2RwRy2RPHZg/55jL3z7cw90lrJfsRJS4NoOvSBgYWmNK9fvcPmNG7x+9TZhu0vVd6nksuQyHq7jpFWjvqzEGI0x3PX3fYKtF8d0wgjXsill/HvQsdmBXNIdZ+P3vYlWmjhO6IURrSBkc7FLY32Lxfklbtyc58C+WfbMTjJULeG6DnGSoiYwSCTGwPLaBs1mi5zvvWsGePGrv8Vjx54+8sqlG49E3e4fCiGW73o9gX1PLZhqARqHMzb7rEr+IWjBkKgU9zu2xWa9zRvXb3P56g1u3J7n+q0FVBCzq1ZmolxM+RZtSLQhVkl/lfcL6vT9ej9+GGPYaHfZ6vYYzmcpZz26UYLSCs+2cSxrkITpHRh+Gz3bjk3JcyiTI04Smt0eGwvLLC+ucvPmPEeO7OP4kX3MTI6Ry/gIAUpphBS0Ol3uLKzQ7fY4d+X331XKw7UFjsXuyFj7GBq6zsrKgB21t6GnMUYLrzghI/XYUCk/9sJz//ahWUsURYRRTLPd5Ts/OM+F197AtQzD5TwbuRz5nGCkkMP0y5lvgoIDt5JO/rYLaocha+0OnSimlPVohxFL9RaBShjO56jlsjhS9vX/g3rOIHKn0JNBebOcz1PKZekGEZtrWzz7re9x9dodnnjsBGeOH6RUyGM5NmC4PbfE4uIyst9M826O5179PcbL7xvutYJTutF4xRhzUwghjTHa3t7ZQiCwexOOxenJ8ZHhWw+1pqQXBJy7dJX1zTqLC8vsmaySy3q8cukmPlDJ+DiWJFb6Hu5e9LkF06/3bvNClhCEScJSo43AkHNtmr2IMFYkiaIXx6y2OjiWxVAu09f37UAw5q5q8a47S9UUQkqyGQ/HtmiHEfXlVb76tee5PbfMe99zguOH9tLp9Xjpwus0Gw2iz3zkL0QkPDM5Nr5x5daxKFAjwM2+yxd2H5lpqrUCm8le12X6+bfgw1+8+EWOH/gUX//2Dxgq5zm8e5Sx0Spv3FpidXmTqm3j2Vbfv6YB7i6CShGIFLK/Yg2WSBnJzU6XtXaHopcGynYQ0EOQsSySKGErism5DtVsBoQYtODEKiFSiozjDMRW27/UWtOLYywpybgONdfF6wVstbtcPHeJXrfLRr2JMYabt+bxLYtX/+f/5i/EAK1PfQjnf/l3u5XSU0KIl/oyRTFwQURM25IjEyNDM1fe4kL7/sW/p9MNyEnJ4b1jnDw4y+Ubi1y4dBNLafJFP8XU2vTpiXQ2gjhVJbt2ioIGnXJSsNUNWKg3MUrjijRIu1KQdV1KGZ8hIdjo9kiMJkoUrmNjSK8fKUUrCLGlxN+u/fapCIyhE0YDlJFxHPK+R8Z12Gi3uXXtFitrmxjLIul133Xfv3Nc+rVfYfw3f3ei1whmoVCG1gYg7cEM9Tq7bMGBYv6+0v59w/+t38evFHjyzCGOHpim0e7x2pXbNDeaTJTyqZKhr99UxiBMClXrvV6qGrYydzUzVup6mkFINuNzcGaUSsZPd48QVApZhqtFSsUCF28v8sbNRXpRhGvbA84kUZpuFJPzXHzHGWhrRN/NdaOYSCk8xyLrOilrKwXVfI5eHLO2tsFGL2C4VvwL71UYqpVHNtvLe0OpJ4nZ3A7CBrBR4bTjMj33G3//oRc4vu+TeBmPs8f3cWT/NI7jcP7KG8zNrZJ3bHKum/p8IwhVTJgoPNvCkK7EjOvg7MDYUgi22h0yOZ8Pnz3N40dmcW2LOFY4jk0h61MsZslVipS/e5H1rRb1tQal7N2y5LYBon4P6yDG9zsrw0TRiSLKsX9f/Jcp1PU9MIZuJ+D0oU/xyutf+gszgO/YWIJd6GQSuLjDAIWiTWtmcnz00Osfe+qBL370yM8RWhaH9k5z7MAMnudwa36N16/NoYKI0WJ+IIbCaFpBSKw1np0hiBOUNjiWhW1Zg9pBGMX0VMLpPbP8wkef5MDMaNrsoXTKfEqJ5dqIfI7puVVyWZ91tZUmaSKNIaFK6MVxKlPZAZa3A3yiNUGSxoltw6SxQ9GJYizLYqJcYqXZZmOjxamDP8urfaXfuz28SgEpGUMlY3BWwksq7Vp39KTtMG1LnAf7/f+HZi9i7+wExw7MUC7kaLZ6nL9ym8ZGk6LrkHGdPoMJYaJohxFaGxxpEcRJqqe3bO7mvLDV6VIs5nn0xH4OH5gmn8uQ8X0K+Sy5jI/tpH9va43blxnebdlIlQ1hoki2Wc+dGst+trxNYadFo7vsqDYp7G32InzHYaSQxxeSzc02Zw59+i/EAN9+4d8zOT520BZmjNHYxRgjARsdzNiC0Yel4Nnf+iIjQxWO7Z9hbKhCEMbMLW1w7cYCroFSxk/5tL4BOlFEpFO/KyQEcYIlBXb/+kIIEq1phRH7d0/w2LF9eLZNL4gIoogoTunqMIyJwggTxqh+rSDF/imEjbUmShLMTqVE/2ttDLFS5HM+tXIhzX7VDnq6v1BaQUisNDnPZbSQx0OwvtHgsR9BqPV2hmPJnNB6hNZiCSGQDA/bGDPlO85w1n/zBnj82NMYKTl5eJaJ0VRmuL7V4vK1ObqNDsU+J692KNW6UYQUgozjEClFO4oGRfV+vyadMMLL+pw5tpdDsxPoMMZsi7T6jlrKflFFShKdFl7S4GsGbkQDTr/1aMDri5TiiGJFrVJkcrSK7zupYmOHCDbRmkgpEqVR2lDIeIwWctjKsLRa532nfvFdN4DQClswQtwd5+xZWxLHNlqPzO7adezbF770JsjZDmN2z4yzf3YCz3Ho9AJuL65y9fo8Rcch6zn9mkBKFStjiJTCkRLHkrTDiFYQIZCpHFGmrqAdhOzZNcahPZNkMh5xkgwC886sOUWymiiKieMEQZoJK5O6Ht/3qJUKiP6k75TAREoxNlRmcqSS6opUcu/vE0WsEpTZPoQC8r7HaLGAiRULK5uc+Zu/+q4awLYEUlBDh+O89JIlqSeOJalh1JuWf+5ffolszufk4VmynouUgsX1Oleuz5N0Q8rZDLa0+0GVfn1AkyiN3V/t7SAkVgopGdRyY6VQEvZNj+JZFhsbTYSUO4sBb1Iu9IKAMEqQQtANI5rdAC0Fo8MVJoerg8rctsJaKUOsNVMjVcZqFSxLDmIAwpCYVKyb7BD5amMwiNQIhSxhL6D9599/d12QbeE5dhXFCGBJirIsoaz7q2N7PPH+v40ysGtyhMmRKkJApxdy7eYiC/Nr1HJZPMfp11LEwLUkOq1oSZkGugTI53zsvnTbmNR1KAytXsBWo0MYpdmqMHdh4o6iLVppWp2AMIxwHQtlDCvNNjGaSilHMedji5TeTqWQaYwxAqbHagyV84MJ3h5K31XZ6T4vnTbypvRF0fMYymRot3oc2fOJdw8JOTZTU5MHpDQyPKzMAAAgAElEQVRDqQFiarakIMy9JFRzYYVSIc/+mQlcxwYBNxZWuXFrCRElVLIZDGYQGLcJn8EqM6CMIZfz2T05jOfaaKNJtKIVRrieS62UZ7RWopD1U5piB+m8vZqlgChKqDd79IKYjGuTcR3CRJHpi7i2Wl16cZpwaZ2KAZTWuL7LzHiNYtZH9btpTJ+0UwYyGY9SPjegxMWAH0xr3NVshqLj0Gh0OH343UFGG5/4ILZjFbXWJUolS6LDimWRvb9UmmjNxGiVybEaxkC7F3Lhym221htUc1msHYhmJ18fK4XBECfp5+FqkQMz40hL0u6FbHV7dOKEY/um+eknjnPqwDQ53yVJ9L0qhf6ESCFp93psNlrEUYJrO0ggl/E5dmCGiZEKa/UmrSCg0evRCgKaQUA7ishmfUZrJTw31ZUOsuckzbRr1RIjtTJK9Q0gxaA8KfpK6qFcloyQrK03eer0jx+UL/363yOJIixJkUbDkiRJSYC7cyLPHPoU5VKeqbEaxZxPrBRXbiyyMLeKawSlbAZMv0F6R3ZpjCHuI4owSTBCMDZUYdf4EJHWLDXarLW65HI+H3//aU7s34VrWyRKD0qRO59jW7+5Xm+xsdXqnx0k2Gh3GRku85HHj3Pm4AyOFPi2jTGGbhyz1u5S74UUC9m0I7LvZrb7BGKVZtrDlSLVYn5Hs8e996ZfOi37HrY2zK9svSu7QKkECXmoZuR/9Ut/46NTk5NTO3U9nTBifLjKxHAVA6zXm5y/fBMTxgwXcrh2iigavR6tMERpnR6qhEldQaIIYwVCMjpUYd/MGNmMh1IpNTE5WuHoninyGZ84VgPy7J7d1K8VKgF3VjbZarRxhSSIY5pRxPvOHOTU/pl0IRgYLeYZLuYZKuTxLAvfdzi6b4pSpUiUGNCp/7UtiyhRZLMeY0NlCrn0rIjtJHLnLtzWuGYdm5LrEPVCTh381I8vh9QaIchCOyd37dr1WKVSGd4pfBVCMlwrUy0XaHcDrt1aYnO9Tt6xERhWGk0W6y0WGi1aYYhGI/uZaRAnhElCGCcYYLhS4MDuScaGy4MgNDM+TLVUQPcFWfIhuh0hIFKaG/NrdLsBSZKw3u6we3aMDz15AmnbvHZ9gdV6i14YEUUJcZQQRjHFvM8jh3dTzGVpdHq0u0FaWwhCNlsdCvkMUyMVPMfuo5+7G+B+CYslBTnXIW/bbGy1eOrMj+mK0uu7ZDM5mSvkp6//+i8Xt639xPv/NhnPpVrK47gW80vrvHblNkkvRCtNPQhoxhGBhFYco4xJGVDMAE+7rovGkJi0FWhycoR9sxMIWxIbw9RIFd9P/2abt7kfdkqZJm6dTsAbtxZZ22zQixW5Qo6//P4zHDu4i2YvYK3eAinoJAmNMGSj3SHWmunxIY7smcIGmu0OrX4+stnp0QxDJkerzIxWQetB9vwQ6RzKpDxWKeNhYsXGVvvHS8bSDxsTubYtrezKTz3Gnl8rpFBto0E241HMZ2g0O7z2xh1u31kmb9sEQCbnM1MrkgBXrs7jSQtbykGnesZ3GRqpsLJeJ9SKrO9RzOc4dWg3Xxl6hV4YM1It4br2jsM47tXoaG1wnJS0u3pniYvX51jaarJ7YoQPPXGcjz55kko2w6rZ4tCucXrBUdCGOE5odwMcx+LJ04cYHyqj4pSqnhyrYek0pmQqOc4c3k2tUiCMokFmfa9cMX2yuJ/XeJYkY9sUXYd2u8tjx5/muxc+/yNbQIAkxrKNMZG/uO4mffVzrBJKuSKuY3NncZ2rt5cQUlIZKlMbLjM9MczkWI2VjTpLc2u4QmIJQZCkjXj5rMfZI3t49ept2p0A2xI4wNnDuzl9eA+3FlcZqhRSgkzpQQJ1j/JBgCUtVupN/vz7F7mxuEZtqMSHnzrFz334MXZPDKPDmKFClp9+8iSPnthPN0nohTHtbo+s53Boaoyc59ALIk4dnCWb8VOI2u9DePL0IeaX1+kF0Q4eiR0QOP22FycopXBkqh0q+z6dZpt6o/Oj74ABHMPY7U577pFP/IPhcCpf3C4T5jIe2kCr08P3XU4c3cPeXWNMjtUYH6oQJ5q5xTV0kmB5HkLI1J8nimw+w9nDu4hVwrk35lBKg9HMTI/wkSeO89r1BSqlQiqG6p+Asg05tzvYtttT5xbXOPf6bcZrJT763lN8+sOPs296FJWkteJyPstQrUwsJT2lCJVCa40nJTkpkSqtnj12Yj9nj+/vM6kGS1oUCxluzq8QhHFaOxbi3hy8b4wgSQ2Qc9MikGdb5F2bThDx2LGn+e7Fd74LBuVsG20vLiy9XK/XHy34SXE7W3QdGylgenwoZRMrRQq5DK5tk/Fc2p0mm1stjNL9rpW7IikD7J4YIZfJ9Pt9JYkAxxiOzE7gWhZRHLO8usVouYBtS1S/8W47QElLDpr1zhyYZe9PjvLEyQNMDpfRKiHp09u2bRHFCUubDe6sbVFvdzHGUMr4TFRLTFSLZH23L7RKG8C3hde2EOkxObHqtz3dp4cTabN9rHQqn9xR+C94Hr1uj61m90dtSMAYEqSI7K9+9Wtfb62tTJUzzG7rfqy+9nKoUmJsqM+jqJQQC8OYVjeg1elh94vgWutUim4MRoBj2zx1+hATQ2VyWY/bc8tcvjbPa9fmWNtsYLRmuFLm1OHdvOfYHkbLRaI46ftGAVKCDTMzE/zcxBgzI1VyvksYhkRKYdkOriOZX9vihfPXeOXSDeqbDcIghcRGWBQqBY4f3MVTJ/ezd2oYKSVRmN5DCkHGdwmjmChJ0kUk7pPL9EUEWqcIz5EWRqRw1XdsfMuiE4Q8/tG/x4v/+TffcRAQECKSjn3j9p2Fkh127yZTfZm2TIsYYRT1uRIGarhYJfT6hfC0z0rv4OqhF0ZMjtcYrua5cmOBP/nWq/zBt15meXWLqu9Sdi0uJZpLb9wmVIaPfOBRcpUyaNU/qkCSkZJdYw7CcTBRTBRFGOnhZgFp0Wg1+Nr3LvONFy6gujFO0MVKYiwMa+2Aly5e51svX+b6nSU+8+H3cGzvNK5rkyQq7bQ3JoWucZIW83lzM5E2aUKpE0U3ivDdVLouhcC3LXphQnj9nTf1CSnR0MWy2jZCNRJDqHdYZ2dHSyojEYMaqzEpNxOEUX8HpIGqFyfoQWNGutVvzK/y+W+c4+uXlrm13OQDB2b56IlDuGGX23cWeOHmPH/67DmKu/fykb90CCuKQKeyFTPQi4JwwQW0UgjHIbAkL5y/wZ88+wrjToZf/Nj7Wb99k/rGRkqjGMOllU3+7I3bfP6b52iGmr/1ccmZw7NopQd0RLeXGiDnuINVv/MMY6U1iTF0k4SNbo+y8cl5LkYYPMvClZJWN3hHk3/ml/4Rie2gDC1sO5AkcktrutsV1YFL2XHi7s6zF7Qx/YRH4VgWUaxYaXao98L0oZXCsSUbq+s8f/4mLy/2EJkix0bLnB0qsDvvUXVtdlWLPDo1RmdllZdeuUS3G2K5HtJ2ENJCyNQIZvuIYimRto3l2HQ6PV743nmsVodDRR/ZaWIZRcZz8FybQsbn4HCZx6fHGK6NcH6px1fPzXFrtY7ju9hS0gsj2r0Q1a/WiR3hsX+8Id0wZHSozIceP87JE/toxHGaeBqTHj4iJWEYceQf/9bbNkD2pUs4ro/SbNGyEgnWVqJpbLeLSQlhFO/Q9fSz1P7W01oTRUl/JRmWGy0W600ilXL1SqXtQq/fXOTSUpNMZYSiDjhRyzPiSG7NL3L+ziJr3YDpWpmS0SzfnmNpeQW1rZbTCmE00hgkqbTF6FTDmWjD8sIyCzduMeJIhjzJzVu3uTC3zHO3Frm8VqcdRmQdh8MjFXYVs4yMTbHQtXj+9UXiTAk7m6XbC2i2Oqg+kBA7zqwQ/QjcDSJ2jQ/xyY++l89++ic4dnQPvUTRDWNcW6YyyURT/PI337YBgihmbW3jJsh1sJUEp6s0W8Jy2Pcbv41jWXSDMK0+DZjJgZ43TbhUQpIkNLsBbZWAnRa+LSEw2rDR7nFttUVbOYxWCuS6W4z7DraQnL+zyFdev8n55XW0EJRch7DVYWV9i2T7QAlzt+474IiMAcsi1Ial1U2iVoe8beFIwXqzxcvzy3z1jdu8urBGvRdiWZKS75KLOuyfGiVfG+HKYoO1EEy5QtsIGq0upt/8jbgLh7d3QKw14yMVTh3ezfvfc5QPP3EC1/foRXEqFujXMLpB+LYNEMYJm1ubcyCWYT2RYCdayvWtenNx9HN/iO85dHsRQRTvSJDMIDnRJm2O6AYh9TBiZLzGxHgNx7YGO+bWRpuNxMbLFfBMRNnE5GwLLQSrnR5X1jZZbLaJtcaWacEljJO0KUP0G2OEuPuxwzkoDL0wTieu38CXGMNGL2C906PeC+jFMaIvArCjgJJrMTI8hJEu1+dW6GUqtO0czV6EMHd3+qAfmbSwhBSMVksMZzxqrsOxPZOUSvn0aE2dUjCWkATh229rjRJNrFnHdhc4ckRJxr0EIeYWlpavBVFExnfpBSHtbpCynNtdJDswQhhFdMKQbCnLsUOzTI1UMcoMCui31hqE0qdcqWKiiJwtB4G8mvXZUysxXshhy1RaaLkOuUwG2b+NeHDiAkZjCUE2lwPLThs5jMFzbHaVixweqbGrUiDr2oOj7m0MJokZrtWo1Ua4cXuRduLS0B7NIMKWO/uR7x6VnyiFn0kZ06JrI6OIYtYn47uYvu5USoEt066g8suX314KICw0LGGbeS5dSiRLSzFSXo00S9tKNp0kNJrtQalwZwptjCGIYpCSg/um2TczRsZz+weapqr/1c0mWC7DIyPYdloz3sb4M6UCP7l/F49Oj5OxJR1lyBSLjI/UsNF9ZYR4cDupUvhSMDY6ilMq04oV3TAi77ocHR3iQ3umODM5Si2bTdumpNVnOg1Dw0MMjYywvlmn1+kwt7zJ6kaLrOOki4y7LbXGGIJtRcVIFd/3iBNNGCUkO+X2pIdLKaU59nf/2Q+d/KdO/BxBGG0qwxyl0gZgJJDgebcixfV2N6zHcYJnSZrtLq1uMKh8bd9UKY1AMD5S5fiBGfJZnzhK7lK4UhKHEba0GB8bpzY2zmYvohtEWEIwUshyenKEfUMV2t2AwHYZmZlhaHgIqXXKTj7goA8hBEalSdHw2AhT+/fTEBbzm5t4lmSimOPY+BB7h8rU8lkKvofRmmac4BeKjI+Nki8W6AYBd268waWLF1heXQdpDXZdX7RBL0qodyOGKyWGKkXsfgl0ebNBq9NF7qgVyL5Cz7R/eFbc7QVsNRpXtbbusLISAiLN0dvtOliXVjcarzXbHXIZhzBKz2jbyVcaY9BKUy3lOXFg1+D0xChOBrp/z3fJZlwEhpGRYQ4fO0HD9ri91aAbBGQcm7zrkCQxl5bXcUfGOXbqBNlcBqMeTg0PfqYUpYLPk+97Emt0gtdWt6h3utgSip5LznUo+h6uFKw2W3Qcn/HZWUaHh1O1dC/gW996jjvXX8WyOnSVIojSBDBVXCSst7u04gDHs1MxmW3R7IW8dmOBTruHbUmEFAOXtU3c/bDRCWNixTVs99a2hnj7n9soXP98rHl5YWW9blsSaXR6/qfW3D1MK/XzU6M1jh/chee56VFkJu001xjyuRzVahmtFbZlcfzkSfY++jh3lOTc4go31jZ4bX6ZF24vMm/lOPLE45w5fRRLJ4N+owd2KfYNY7TC1zGPP3qCMx/8S3QqY7y8sMrN1Q3Wmy2anS4bjSaXF5a5sNlm+uRZjp08hTCGer2O1nDx8g18Z4tHT2WoDgs2Oj16YUKzF7PZ65EpKfbtc4hUh26QSixvLq3z4rmr6FiRcex7GFxb9jVPbzEe/6lfZn2zsRYpLuLJmzvbVM0zz8Aznxu+Gt8KvrPW6HygG0TljO+BNiTKYFs2iUrQ2uD2OSLLSreuUunxkNoYEmPIF/OMDg+hVMLa2jqnTp3ks7/0N/hdBDde/QFrW920JdQvcPIjP8FPfewnmR4pIVp1BBIh3zqFRytMGDBUKvLJT34MbSTf+E9fpLVZZzNSFH2XVhQz11PI2QN88hd+kWNHj/Lyy6+yMHeHXRMjOBJ00GD3hODQPsmX/niLxWaMtA1jk5LTJ3IUcpKr1xVRolla3uAb373Ipat3KFoWvmMP+qO1AduSmPvOi3tTHfj2Eq0wmdNYl+nc/c8a2waQxtwMRD5/Keh1Xrx09Wbt1KG9k0E3pBcmjA5V6XRaqCS5R7Ww87PSBq2hUi6xZ3aSpfUOa2urSCk5e/o01UqVixfOc/vGDYS02HPwECdPHGKyoLG66cHi4od1hxqTblpjoLXBbG2YX/z5T7P/wAG+9+1nWb55g+WwR26szNkjx3jyAx/gxPHjWJbFlddfZ2V5gY/9/E9x7fYS//Z3ztFudfjkRybYaii++Kcr7B7P8POfGKZWEXzru21mx6ZxLJs/+MYP+NLXvoutFLm8N/A5WutUnec4bP7EYw997Pc99leZ32y2E8OruNZNEyVaICxAbfcHbJ9pfF1j/VEjUKe22sHk8uoa+UKBkeERiuUqnXaLMOhhtMECLNsenN+ptUEbKJWKHD28n/z8Kj0NWivyuTyHDx1kfGKCjc0thBAMVbIURBfRXcckCUJaOwCnfHAVw5hB44VJEqzeJtPFKqX3n2Xv3r2sra0TRSHZXJbJiQlmpiZxLIvzFy6wuTrHiSN7mD14kEs3FphbbHLtWp3xsQLve6TE8lpAN9DMLwfcmhfMLWQ5vjfLHz37Ei+++jqdeouRfKZfqzBYMqVlEjSu6/DKr/3Kw5OvepuVreaiUnyTYu62iO52udk7u/WNMR0hci9FJvjqlZtzZUuYA6VikeWVKnv2zmLZNu2mRRgGoDVaK4w2fXbPoISgWi0xPjVOdahKvREhoybGASMkpYxFabIGKoKwgWmvg4pT7kcY3tY/aBJ94a5lYeIA1VohnylxYraG2TsOwkJsy9h1gIoidGeVowfG2bd3mjAyvPD9S6i4ietZXLzSZXLY46efGuLbLzX402+t0e1Jsu4QOrrJ/NIqza02w/kMnm0P1HXaGCKl0YDvOg/3/R/5OzSCJA4SLuC6r5rNzcY9jdo7j6kRQgj27dtkcfEPu2H30PJmY6K8uJzPZH0q1QrDIzVsx6HdbBGHPYxO0qwxUfSURlmSkaEqGd9jtFZmtNjF6a2gkxZIpz8pCagIoQKE0f3Jv79k/Va1PO4GactKjzPo1DGdBkLaYLkYYfdJPBA6Zs9ohj3Tx0k0PPfciyzOXeLwPsnUSI21zYQ/+dYav/CxcfbP+nz3vGZuIWCsVKezuYVvCUaLWVzLSuFmXyURKU0vSbBsi/DsoYc+cu/qHe4srV0xUn6NKFrYPvCX/hly9zVqI7l2LaFavaLC8A9WNlujGW/tqUI+S+HGTfyMT6VcgoIk8X2SOMDeaNCLIrpJgvRchocq+JbEURqJhl4D0WsNXBVCYPqAW0h7RwH87f6LMvHmuJAkoPp9AtsldtEHeQIKnoP0Mrx84Qp/9pU/ZbK6zq6JIr1AcPVml6u3u8xOZjl9JM/pw0VWFxvkpMS3Zb+rRw5q1YJUrRGGEYFS5Io+L//2rz3E9/8idzq9TqB4Fcf5BmFYv/8csO0uSbPTFbG52SGb/fMgCIbnljfKGc857roupWLa6JDL5rAsC8/3cf1NsrksxUKWaqVILpfBMgYThhCGiH7L0l09hkBYNtgOCM3dyPtOjojp9xvrdPKFitMETvdlLgNvdpfFRUS0turcnlsg67YJui6bm5LmpoWrfF74fovRmsPosEu17OAoScZ1B3WBnf0NcaJoBhGJgGI+89CnXFtYY3WrfV4J9yuE4fyOlcbO42rud76pMbrdVfD+qEdYvDG3nPMcZ08um6FQKOBN+dj9wzryuSLHD+/H91wc12Wj0aSrFJ4UmDhBWHKAGtIVahBKYYQcuJAfDn8ejoqMUkildkgLxUB18P/3dmbLcV3XGf7OfPr06QlAYyImkqAocJBIkZREMVHZUmRbkWK5XOWKnRdw7vIAuWFSlSfIXa6cRFFKqoqjkktD5KgsUrLMQRwBkBgJNEDMU49nHnJxGiAJUwo1eVf1dddZa+211/7X2v8fN4f+I8dFlBXMQo5svo3xkQViz0GKDXQ5RVfGYHWjzqXrNRQtRpEFiLa7g80yM45x/QAviKi5LnXfx8jojH1B9D/z+GvcXt+a9yLOE4mf0GTM2g1vydxTNt0RnxR28sKRUiTdfLvu+53jd+ZfUWSp1zRNUoZBe3sRYshmM5x48hC9Xe2MT5cYvjXFE8cOU+jtQJDFJoq63XMVdiYTdsD3h0R+HN8/py7sUA/sjhEhUfAhDh+Y6nmA6gYhubUKRopsR5FcoYNaRcZAoCWXQpUFZEnA8jRGx2oIUoQhaMnzKpLSOooiHD/ADgM8BDYcF0kWyZsG0w+hvn/2B3/L0kbFtjwuRpL8WyJngYdobd6fgqL7hWXuE+MM8BkPZfnNuh+0jt2ZVzRd6zSazFSmaWKmU+iaQiGXwXI9hsdnuXb9Ft0tWQqmQdSw72X4bcIlQSSWxAcjf/fDAFF4kGn5IXzFgiCAJBPFCVAn3A+fCwKCJCLICrGs4Aki1WqDWqWBIcsUDY2cqSTT3HGMpgrU1xKsqbWQTFKEYYTrJ68pAyFGN1OkVAU5CDBUmen/+Kc/Mn7/v75DY2qela36zSDmNxjGNarVbaWJhzLnBl+kc9jcDS5BcMWXtNe3LFe8OjJxSlGUPlVVGRo6iGGk8P0QVVUZ3NvL9Owin3xyidZCjudPH8Mw0+C4zYHUxOix2Ew/uy51OyRZYqJUmtx2YoRoN+1YcxM1HQAJDB43+71IIqIkIUgifgzrdZvZyVnOnbvAxO0JDFVCURVsP2hKFcQ0XD8ZwtVUNEmi4frJsFkUE6sSLcU8XZ0tlGsOrudjqiIzDyF3LfzjvzB5d2XMCflvdP081WqZL5EylB9BeFgAXDPlXqjbUlhzQ+vC1ZE/U2Rlr6ZpHBjch6KqCSaezXD65BE+PHeJ9z74mEw2zbGjj2MaMnEYJodxnFQpO3kaHiD6i+KkWe6GMZKioMsSmiAkbcldgwM7Ix6yAs0XtqIQEwkCDgINx2Hp7jKXr43y0fmLXP78JpWNMoPF1kQTLIqQRIEgiKg20VpJFKg6LnU/IFIk8m1Z9g90M7i3mzAIOX9xFE2CqYdE//HBV5m6uzzT8MUPUI13cOr/78iE/Chn3cAAom2DHISjDvzKClg+f+Hay14QHhEFOHjwAKKUvJTs6+ni9InDXL4xxr+9/jbWT37ImWePk85kwHWJvaSbtY2eCvenF1HA80JGxu8wWVoklzUZ7Oth754ODE1NnNjsS+8AdKKYnDWKQixJ+H5AeWOL29MlPr9xi6uf32R6fJr11XXqDTuhSJPEHfiZ5vhh3XF2FJlSpk5Xdys9e9rp6y7S19VG3XY5d3GESrlKa0anfOLQAzZ6Yu/LTC6szdV93kfR/x2vPr1NyMGXqKk+igPi2Vk8oAwtDjgueIFP4P/+8k0nCKOTDcvh+LGj6HrC8zB0YB9+EDJ8e5r/+vX7zN1d5NTxIxzo30M6YyI2UU38AMKouTuSxjtxjCrJaKIIno/vuERBCGpibCQJQZZAlprgXIRr2SyublJaXGF+bpHpyRlGx6aYmpyhuraBFCQ9DkHXCIWkOxfHMWKT8bfueii6SkshQ19nG+3tBbo7CnS0FSgWspSrFldHphmbLJE3VD4dvidccejv/xlef5c7S+tTls8HyKk3eGJomCtXwm0mmm+kJ9y8Njez7lngLRlKLdA4AHwvJfOX+3qK/a/+6IWuY0cPkc3lkKVEeG1iZo4Ln49gux6HHtvPiSeH6NvXT76thZyZIqdrqLLCPQKgpEry/ACnORggyzJmOoUsy0mEhhENz6PiuFQbFlalRnV9g4XFZeZKCywsLLG4uMJUaYH5xTVyqkqbaeBFEWXbRVUUBloLyYsawPY8lmoNOnrbOTo0wEB3O7l0Cl1LLolb1QZ/uD7OlZuT6BIM37mnJPjc4Z+yVbfjmcW1204kvouk/ye+NbyN9d+b7/pmDhB2VUZCc+d0AXkk6bBM+AtTYehnr708eObZE3Q0tb6CIKRcrTExPc/U7F0sx6WlJU9/Xw/7+rrZ29NJe0cr6VwWSVOJmp0vRVUSoG9b+8Xz8V0fr9GgtllmaXWDu8trLK+uU9ksEzoWpiJQMHVyhkYYxgxP3+W9z26yVq6RT2koqozj+eiI9Bfy6IpMEEVsNWxqhPzohZMM7e9FFCTiOEKWRBqOx4Xr41wbmUKMQ0buM/6x/a8wt7xZrbn+qB+Lb6CY/4NbLZE8DOVhJefXcsAXrc5OIb2ygkgmo1Gzn5LF4Ie6wjMv/PlzZ04dG+LI0CC5bBY/CKlU66xtlFnf3GKzUsOyHHw/oGE5IAoUCjkKLXlkRUZTVQxDR9c14jim3rDY2KxSqdRxbQcpCsjoMm1Zg2IujaHIeJ6bEMPWLGq2hxPG2H5I1fYQZZFiPgNxxOTMAvPTd+nOZsikdOq2w6Zto7dm+KsXT9HVViCKEhbIjXKdS8NTjE2VkOOI65OJaMWpx37MWrnGerk2bfmciyTpPVT1Is88s8zHH2+nnYcqp36rDmiKEiSMxHSloHIQrOdViaeyOsWf/+ynLx4+uF/t7+3GMFKEYUi11mB9q0K5UqVas5hfWOHG7UnmFlbpbm/h+yeHyKYNbs8uMrO4jhcEWHbSxuxoybF/TzsHB7ro6cgjRVHi2EqdiuXihhCSlKWKpmOaBrlsIleVzxg0LJvfX7rJp+cu02mmKZgGq+Uq9TDk8PHHefHMMbKmQaVSZ3l1g5GJEndKS0SBiyGL+L5HpeFQsbz1rbp1xY/4NBL182RSN/i7rRpnH0AUHsn4j1wFffmYO2JCRixyR/sAAAURSURBVHpoFGZXPMG7umkHT/zqzV/PdBbSe/7mr3/+2kDfHtpac5jpFGY6RdBZxPV8Bnq7MAwdz7uG7zi0plROP7mfrUqZ335aIgwjDvZ1cPRADycO7+eJwT4KGYONWp2Z+VVmVsqsVC1iSSKbzdHekqeQz5Ix0xi6hqombCuqKqOoGplMJrkvRAmO5AYBRjbD0UMH6ejowHddNst1hm/fYWTsDr7nktYVrFDGCQR3frV80w24FkrS/5KRr1BxlthyHM4+AGbF8VeI6m/igF1Pnm75wDIBmxHGdN1z50orjVfffPvD0lNPHup/bH8fA71dtLXkSWkqmqqQNvRE+zGfYXhknI2ahZlNc/LoIKOTc4gx/OLlMzx5ZJBiWw7f8RibmOPS+CyrFRtVT9HZs4dCIUc+Y5I2UgkmJcs7fEEJzSVomkYul0VVtSaRR0AQg2noZIwUq6sbLC4uc2tsismpErZloWkqqKlocmbuou0zGoriZRTpJn5qgkq1vAtH+0qG317S2UTb8KumH2HXdktQmRMnRJaWIvBd4tgWRMJapSrMzEx7SErP2maZet1uEnPEKLJMIZ+ls9iKosjML29gux6dhSxD/V08ffQAr/zFM3T3dnJ3eYOPL47w2Y0pVmoumZYW9vb3MjjQQ09XkUIug6YqO3x1UVPTcJvIT1UUqrUGtyemwQ+QBKh5Ab4AEhFjE9MMj04wv7hOKMhYjjOxsVX+bHWz8qEdiR/HUvojUson7Ns3w9rdxs43fwPjf+0zYBfT+v09xPg+hyimSTYj8DgxP/BCThc7u0+1tbVme7s76O/roqu9SGshT0shSxAEXBuZ4NbtSY72d/Dy955m/2MDyJLAtevjfHDuc8bnVsm1FjgyNMhAb0K+ys4YfROA4552QRgmhBye6xGGEeN3Srzz/jnEho2pyKzaLg1iuooFHNezZ2dLY2HEchgzH0bMRkjjqNIYnrZKl2nxy186nD37tXL9d+GAR/rjk92CsVmnN4bngoiXvJijHXt6j6iaRrGtjZ6uDvp7u+jd046qKly+dovlpVVe+v6z/PgnLzE5foc33nyXxeUNHjswwJFDg7Tms0iSSBSGiTJeECZT2UEi8Oz5Po7j0bAsKtUaG5sVKtUaK+ubzC2uk1NUNFFg0/a4PXd3mDi6AZSQpBKCcIcgWEHPNVAzFaqnK3H8Vrhr13+jqP9WqqCvsv5BEMS30rTHOkdcnzNezPO6mT+up9IFRdVIm2naiy3093WhKCqj47Nk8zmee/Y4c6UFRoaH5wf7OxpPDe2rZrM5A9U8Uq7UaFgWVlPS3LIdLMuhYdlYjoNju9i2TaPewLJsfN9zFpeWrgYh44SsxqC5EXlflJcR5Y+QlDnU7AYnDlTi3/0uuD/Q7mvXxd+W4f+kDtj+mBMgO0X6w4CnIzjqBvS4Iflcodi2sra2JkjUNJklN0R1fXRZxBVF3D15caWnwHoUIK3VyUlaNpdtLbY7XqDOzM7UowgliBDiZlMsSl5SCeK9Qd9IFqlKApOixIjrsVF1UT1obzZKbgCNPy4s7qXV+DsylMyfaDU/wBcEYaZYZDnvcUEXGTB0is8/f+rxD37z3nAYYTs+diDgezFCHBJ3pqiLURSNLJO2XTJ+gLan28x2t/WvZ+JImJiaKcUhjqRSFwUqcUBDFXEVkcAVCUWBKAtYIpFdxi8cwr91awckmyIRq/Ob59j2JSpq/oi/4wj9P7/IIgF0b7ZzAAAAAElFTkSuQmCC',
      reply_to_me: 'png;base64,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'
    },
    proto : 'vichan'
  };

  if (!site2['futaba']) site2['futaba'] = {
    nickname : 'futaba',
    check_func : function(){
      if (window.location.href.search(/2chan.net/)!=-1) { // futaba
        site.config('2chan.net','futaba');
        site.max_page = site2['futaba'].max_page_futaba[site.server_name + site.board];
        return true;
      } else return false;
    },
    max_page_futaba : {
      'may/b/' : 11,
      'jun/b/' : 10,
      'dec/b/' : 8,
    },
    max_page : function(bn){return site2['futaba'].max_page_futaba[bn];},
//    make_url : function(board,no){return ['http://'+site.server_name+'.2chan.net' + board + ((no==0)? 'futaba' : no) + '.htm', 'html'];},
    make_url4 : function(dbt){return ['http://'+site.server_name+'.2chan.net' + dbt[1] + ((dbt[2]==0)? 'futaba' : dbt[2]) + '.htm', 'html'];},
    get_ops : function(doc){
      var ops = [];
      var responds = doc.getElementsByClassName('hsbn');
//      for (var i=0;i<responds.length;i++) ops.push(responds[i].href.substr(-13,9)); // doesn't work for sub-docment.
//      for (var i=0;i<responds.length;i++) ops.push(responds[i].getAttribute('href').substr(-13,9)); // may
      for (var i=0;i<responds.length;i++) ops.push(responds[i].getAttribute('href').replace(/res\//,'').replace(/\.htm/,''));
      return ops;
    },
    get_posts : function(doc) {
      var posts = [];
      var inputs = doc.getElementsByTagName('input');
      for (var i=0;i<inputs.length;i++) if (inputs[i].value=='delete') posts.push(inputs[i].name);
      return posts;
    },
    format_thread : function(doc){return doc;},
  };

  if (  localStorage &&   localStorage[pref.script_prefix+'.pref']) pref_func.pref_overwrite(pref,JSON.parse(  localStorage[pref.script_prefix+'.pref']),true);
  if (sessionStorage && sessionStorage.pref) pref_func.pref_overwrite(pref,JSON.parse(sessionStorage.pref),true);
  if (pref.pref2.KC.summer_time) site2['KC'].time_offset = 2;
  pref_func.site2_json(false,false,true);

//if (pref.test_mode['18']) { // leak test about 8chan catalog in 4chan.
//  delete site2['8chan'].parse_funcs['catalog_html'].th_init;
//  delete site2['8chan'].parse_funcs['catalog_html'].th_destroy;
//}

//  for (var i in site2) {
//    if (i=='DEFAULT') continue;
//    for (var j in site2['DEFAULT'])
//      if (site2[i][j]===undefined) site2[i][j]=site2['DEFAULT'][j];
//  }
  for (var i in site2) {
    for (var j in site2[i].parse_funcs) {
      for (var k in site2[i].parse_funcs[j]) { // working code.
        if (k!=='proto' && typeof(site2[i].parse_funcs[j][k])==='string') {
          var tgt = site2[i].parse_funcs[j][k].split('.');
////          if (tgt.length>1) site2[i].parse_funcs[j][k] = (tgt.length===3)? site2[tgt[0]].parse_funcs[tgt[1]][tgt[2]] : // working code.
////                                                                           site2[i].parse_funcs[tgt[0]][tgt[1]];
          var tgt_obj = (tgt.length===3)? site2[tgt[0]].parse_funcs[tgt[1]][tgt[2]] :
                        (tgt.length===2 && site2[i].parse_funcs[tgt[0]] && site2[i].parse_funcs[tgt[0]][tgt[1]])? site2[i].parse_funcs[tgt[0]][tgt[1]] :
                        (tgt.length===2 && site2[tgt[0]] && site2[tgt[0]].parse_funcs[tgt[1]] && site2[tgt[0]].parse_funcs[tgt[1]][k])? site2[tgt[0]].parse_funcs[tgt[1]][k] :
                        (tgt.length===1)? site2[i].parse_funcs[tgt[0]] && site2[i].parse_funcs[tgt[0]][k] :
                        null;
          if (tgt_obj) site2[i].parse_funcs[j][k] = tgt_obj;
        }
      }
////      if (i!=='DEFAULT' || j!=='common') { // working code.
////        var proto = (site2[i].parse_funcs[j].hasOwnProperty('proto'))? site2[i].parse_funcs[j].proto : (site2['DEFAULT'].parse_funcs[j] && i!=='DEFAULT')? 'DEFAULT.'+j : 'DEFAULT.common';
//////        if (pref.debug_mode['0']) site2[i].parse_funcs[j].proto = proto; // debug
////        proto = (proto.indexOf('.')==-1)? site2[i].parse_funcs[proto] : site2[proto.substr(0,proto.indexOf('.'))].parse_funcs[proto.substr(proto.indexOf('.')+1)];
////        site2[i].parse_funcs[j].__proto__ = proto;
//////        if (!pref.debug_mode['0']) delete site2[i].parse_funcs[j].proto;
////        delete site2[i].parse_funcs[j].proto;
////      }
      if (i!=='DEFAULT' || j!=='common') {
        var proto = (site2[i].parse_funcs[j].hasOwnProperty('proto'))? site2[i].parse_funcs[j].proto :
                    (site2[i].hasOwnProperty('proto') && i!=='DEFAULT')? site2[i].proto + '.' + j :
                    (site2['DEFAULT'].parse_funcs[j] && i!=='DEFAULT')? 'DEFAULT.'+j : 'DEFAULT.common';
//        var proto2= (site2[i].parse_funcs[j].hasOwnProperty('proto'))? site2[i].parse_funcs[j].proto : // old
//                    (site2['DEFAULT'].parse_funcs[j] && i!=='DEFAULT')? 'DEFAULT.'+j : 'DEFAULT.common';
//if (proto!==proto2) console.log(i+':'+j+', '+proto+', '+proto2+', '+(proto===proto2));
        proto = (proto.indexOf('.')==-1)? site2[i].parse_funcs[proto] : site2[proto.substr(0,proto.indexOf('.'))].parse_funcs[proto.substr(proto.indexOf('.')+1)];
        site2[i].parse_funcs[j].__proto__ = proto;
        delete site2[i].parse_funcs[j].proto;
      }
    }
    if (i!=='DEFAULT') {
      proto = (site2[i].hasOwnProperty('proto'))? site2[i].proto : 'DEFAULT';
//      if (pref.debug_mode['0']) site2[i].proto = proto; // debug
      if (site2[i].parse_funcs) site2[i].parse_funcs.__proto__ = site2[proto].parse_funcs;
      site2[i].__proto__ = site2[proto];
//      if (!pref.debug_mode['0']) delete site2[i].proto;
      delete site2[i].proto;
    }
  }
//  for (var i in site2) {
//    if (i==='DEFAULT' || i==='common') continue;
//    if (!site2[i].hasOwnProperty('prep_own_posts_event')) {
//      site2[i].prep_own_posts_event = site2[i].prep_own_posts_event.bind(site2[i]); // DOESN'T WORK, WHY??? MAY THIS BE CHROME'S BUG??? but I found a better solution.
//console.log('DEBUG: '+i);
//    }
//  }
//    site2['lain'].prep_own_posts_event = site2['lain'].prep_own_posts_event.bind(site2['lain']); // works correctly.
//    site2['KC'].prep_own_posts_event = site2['KC'].prep_own_posts_event.bind(site2['KC']);

//if (pref.debug_mode['0']) console.log(common_func.debug_show_proto('8chan:catalog_html',site2['8chan'].parse_funcs['catalog_html'])); // debug
//if (pref.debug_mode['0']) console.log(common_func.debug_show_proto('8chan:page_html',site2['8chan'].parse_funcs['page_html'])); // debug
//console.log(common_func.debug_show_proto('8chan_live:thread_html',site2['8chan_live'].parse_funcs['thread_html'])); // debug
//console.log(common_func.debug_show_proto('8chan:page_html',site2['8chan'].parse_funcs['page_html'])); // debug
//console.log(common_func.debug_show_proto('4chan:thread_html',site2['4chan'].parse_funcs['thread_html'])); // debug

//  for (var i in site2) if (i!=='DEFAULT' && i!=='common') {
//    var proto = site2[i].hasOwnProperty('proto')? site2[i].proto : false;
//    site2[i].__proto__ = (proto)? site2[proto] : site2['DEFAULT'];
//    if (proto) delete site2[i].proto;
//    for (var j in site2[i].parse_funcs) {
//      proto = site2[i].parse_funcs[j].hasOwnProperty('proto')? site2[i].parse_funcs[j].proto : false;
//      if (proto) proto = (proto.indexOf('.')==-1)? site2[i].parse_funcs[proto] : site2[proto.substr(0,proto.indexOf('.'))].parse_funcs[proto.substr(proto.indexOf('.')+1)];
//      site2[i].parse_funcs[j].__proto__ = (proto)? proto
//                                        : (site4.parse_funcs[j])? site4.parse_funcs[j] : site4.parse_funcs.common;
//      if (proto) delete site2[i].parse_funcs[j].proto;
//    }
//  }
//  for (var i in site4.parse_funcs) if (i!=='common') site4.parse_funcs[i].__proto__ = site4.parse_funcs.common;

//  if (  localStorage &&   localStorage[pref.script_prefix+'.pref']) pref_func.pref_overwrite(pref,JSON.parse(  localStorage[pref.script_prefix+'.pref']),true);
//  if (sessionStorage && sessionStorage.pref) pref_func.pref_overwrite(pref,JSON.parse(sessionStorage.pref),true);
//  pref_func.site2_json();


  var site3 = {};
  for (var i in site2) if (i!=='DEFAULT' && i!=='common') {
    site3[i] = {boards: null, tags: {cs:[], ci:[]}, own_posts:{}};
    if (site2[i].hasOwnProperty('check_func')) {
      site2[i].check_func();
      delete site2[i].check_func; // reduce memory consumption.
    }
    site.nicknames.push(i);
  }
  pref_func.site2_json(false,true,false);
  if (window.top != window.self) {
    if (site.nicknames.indexOf(window.name)==-1 && window.name!==site.embed_frame) return; //don't run on frames or iframes
    for (var i in site2) if (site.nicknames.indexOf(i)!=-1 && i!=site.nickname) delete site2[i];
  }

  var pipe_name = pref.script_prefix + '.graph.' + site.board + '__pipe__';
  var info_raw  = site.nickname + site.board;

  if (!window.SharedWorker) {
    pref.info_server = false;
    pref.info_client = false;
  }
//  pref_func.str2obj('catalog_board_list_str');
//  pref_func.str2obj2(pref.catalog,'style_general_list_obj2',pref.catalog.style_general_list_str);
//  pref_func.str2obj2(pref.catalog.board,'ex_list_obj2',pref.catalog.board.ex_list_str);
  pref_func.obj_init();

  var ports = {};
  var messages_to_send = {};
  var init_func = {};
  var receive_func = {};
  function make_port_parent(name,win){
    if (ports[name]) send_message(name,[['CLOSE']]);
    ports[name] = 'init';
    init_func[name] = function(e){initialize(e,name,win);};
    window.addEventListener('message', init_func[name], false);
    if (pref.debug_mode['0']) console.log(window.name + ': Waiting for connection from '+name+' ...');
    function initialize(e,name,win) {
      if (pref.debug_mode['0']) console.log(window.name + ': Connecting from '+e.data);
//      if (e.source==win) {
//      if (e.source==win && site2[e.data]) { // remove "{"name":"twttr:private:requestArticleUrl"}" from someone...
//      if (e.source==win && site.nicknames.indexOf(e.data)!=-1) { // remove "{"name":"twttr:private:requestArticleUrl"}" from someone... in Tampermonkey. // BUG.
//      if (e.source==win && new RegExp(site.nicknames.join('|')).test(e.data)) { // remove "{"name":"twttr:private:requestArticleUrl"}" from someone... in Tampermonkey.
      if ((e.source==win && new RegExp(site.nicknames.join('|')).test(e.data)) ||
          (e.source==site.embed_frame_win && site.whereami==='frame' && e.data.indexOf('CLOSE')==-1)) { // remove "{"name":"twttr:private:requestArticleUrl"}" from someone... in Tampermonkey.
        if (pref.debug_mode['0']) console.log(window.name + ': Connected successfully.');
        if (!brwsr.ff) init_receive_port(name,e.ports[0]);
        else init_receive_port(name,win);
        window.removeEventListener('message', init_func[name], false);
        delete init_func[name];
        send_message(name,messages_to_send[name]);
        delete messages_to_send[name];
        if (name=='_blank') send_message(name,[['CLOSE']]);
      } else if (pref.debug_mode['0']) console.log(window.name + ': FAIL.');
    }
  }
  function make_port_child(parent){
    if (pref.debug_mode['0']) console.log(window.name + ': Try to connect to parent...');
    if (!brwsr.ff) {
      var channel = new MessageChannel();
      init_receive_port('parent',channel.port1);
      parent.postMessage(window.name, [channel.port2], '*');
    } else { // FF doesn't support channel messaging.
      init_receive_port('parent',parent);
      parent.postMessage(window.name, '*');
    }
  }
  function init_receive_port(name,port){
    ports[name] = port;
    receive_func[name] = function(e){receive_message(e,name);};
    if (!brwsr.ff) {
      port.addEventListener('message', receive_func[name], false);
      port.start();
    } else window.onmessage = receive_func[name];
  }
  function close_connection(name){
    if (!brwsr.ff) ports[name].close();
    ports[name].removeEventListener('message', receive_func[name], false);
    delete receive_func[name];
    delete ports[name];
  }
  function send_message(name,val,win){
//    if (!ports[name]) make_port_parent(name,win);
    if (win) make_port_parent(name,win);
    if (ports[name]==='init') { // chrome works at ==.
      if (!messages_to_send[name]) messages_to_send[name] = [];
      for (var i=0;i<val.length;i++) messages_to_send[name].push(val[i]);
    } else {
      for (var i=0;i<val.length;i++) {
        if (pref.debug_mode['0']) console.log(window.name + ': Sent to '+name+': '+val[i].toString().substr(0,80));
        if (!brwsr.ff) ports[name].postMessage(JSON.stringify(val[i]));
        else ports[name].postMessage(JSON.stringify(val[i]),'*');
        if (val[i][0]=='CLOSE') close_connection(name);
      }
    }
  }
  function receive_message(e,name) {
    if (pref.debug_mode['0']) console.log(window.name + ': Received from '+name+': '+e.data.toString().substr(0,80));
    var val = JSON.parse(e.data);
    if (typeof(val)=='string') val=JSON.parse(val); // patch for GM.
    if (val[0]=='CLOSE') close_connection(name);
    else if (val[0]=='MARK' && val[1]>0) {
      var marked_first_post = (common_obj.thread_reader && pref.test_mode['16'])? common_obj.thread_reader.mark_newer_posts(val[1])
                                                        : site2[site.nickname].mark_newer_posts(document,val[1],pref.catalog.unmark_on_hover);
      if (marked_first_post) scrollTo(0,marked_first_post.offsetTop - site.header_height());
      else scrollTo(0,document.body.clientHeight - window.innerHeight);
    } else if (val[0]=='SUBFRAME_INIT') http_req.remote();
    else if (val[0]=='SUB_GET') http_req.sub_get(val[1]);
    else if (val[0]=='SUB_ACK') http_req.sub_ack(val[1]);
    else if (val[0]=='OWN_POSTS') site3[val[1]].own_posts = val[2];
    else if (val[0]=='TRIAGE') {
//console.log('receive: TRIAGE, '+val[1]+', '+val[2]+', '+val[3]);
//      if (catalog_obj && catalog_obj.catalog_func()!=null) catalog_obj.catalog_func().triage_exe_0(val[1],val[2],'',true,val[3]);
      if (catalog_obj && catalog_obj.catalog_func()!=null) catalog_obj.catalog_func().triage_exe_pipe(val[1]);
    }
  }
//  function receive_message(e,name) { // working code for old http_req
//    if (pref.debug_mode['0']) console.log(window.name + ': Received from '+name+': '+e.data.toString().substr(0,80));
//    var val = JSON.parse(e.data);
//    if (typeof(val)=='string') val=JSON.parse(val); // patch for GM.
//    if (val[0]=='CLOSE') close_connection(name);
//    else if (val[0]=='MARK' && val[1]>=0) {
//      var offset_top = site2[site.nickname].mark_newer_posts(document,val[1]);
//      scrollTo(0,offset_top);
//    } else if (val[0]=='SUBFRAME_INIT') {
//      http_req.remote();
//    } else if (val[0]=='SUB_GET') {
//      http_req.get(val[1][0],val[1][1],val[1][2],val[1][3],val[1][4],val[1][5],val[1][6]);
//    } else if (val[0]=='SUB_ACK') {
//      iframes[name][1]--;
//      http_req.onload_local(val[1],val[2]);
//    }
//  }
  function close_all(){
    for (var name in ports) send_message(name,[['CLOSE']]);
  }
  window.addEventListener('beforeunload', close_all, false);
  if (window.opener) {
//console.log('child');
    make_port_child(window.opener);
    for (var i in site2)
      if (site2[i].nickname===window.name) {
        for (var i in site.features) site.features[i] = false;
        brwsr.sw_cache = null;
        pref.cloudflare.auto_reload = false;
        break;
      }
    if (site2[window.name] && site2[window.name].prep_own_posts_event) {
      window.addEventListener('storage', site2[window.name].prep_own_posts_event, false);
      site2[window.name].prep_own_posts();
      site2[window.name].prep_own_posts_event();
    }
    
  }
  if (pref.cloudflare.auto_reload) {
    var cf_error = document.getElementsByClassName('cf-error-code');
    if (cf_error.length>0 && parseInt(cf_error[0].textContent,10)>=500) setTimeout(function(){location.reload();},pref.cloudflare.auto_reload_time*60000);
  }

//  var ports = {}; // working code for test
//  function make_port_parent(name, val){
//    ports[name] = val;
//    var port;
//    if (pref.debug_mode['0']) console.log('parent: '+name+', '+val);
//    window.onmessage = function(e) {
//      if (pref.debug_mode['0']) console.log('from child #unkown: '+e.data);
//      port = e.ports[0];
//      port.postMessage(JSON.stringify(['MARK',val]));
//      port.postMessage(JSON.stringify('CLOSE'));
//      port.close();
////      port.onmessage = function(e) {
////        if (pref.debug_mode['0']) console.log(e.data);
////        port.postMessage('received : ('+Date.now()+')');
////      }
//    }
//  }
//
//  function make_port_child(prt){
//    if (pref.debug_mode['0']) console.log('child :');
//    var channel = new MessageChannel;
//    var port = channel.port1;
//    prt.postMessage('Connection: ', [channel.port2], '*');
////    prt.postMessage('start', [channel.port2], '*');
////    setInterval(function() {port.postMessage('sent : ' + (+new Date));}, 2000);
////    port.onmessage = function(e) {if (pref.debug_mode['0']) console.log(e.data);};
//    port.onmessage = function(e) {
//      if (pref.debug_mode['0']) console.log(e.data);
//      var val = JSON.parse(e.data);
//      if (val[0]=='CLOSE') port.close();
//      else if (val[0]=='MARK' && val[1]>=0) {
//        var offset_top = site2[site.nickname].mark_newer_posts(document,val[1]);
//        scrollTo(0,offset_top);
//      }
//    };
//  }
//  if (window.opener) make_port_child(window.opener);

  var http_req = (function(){
    var iframes = {};
//    var caches = {}; // prevent occuring multiple access to the same url in short time.
    var local = true;
    var httpds = {};
    var req = {};
    var parser = new DOMParser();
    var serializer = new XMLSerializer();
//    var doc;
    var pool; // object pool
    function make_httpd(sender){
      var httpd = new XMLHttpRequest();
      function httpd_events(){
//        if (local) onload_local(sender,{date: Date.now(), status: httpd.status, responseText: httpd.responseText},false);
        if (local) {
          if (httpd.responseType==='text') onload_local(sender,{date: Date.now(), status: httpd.status, responseText: httpd.responseText},false); // temporaly patch.
          else onload_local(sender,{date: Date.now(), status: httpd.status, response: httpd.response},false);
        } else send_message('parent',[['SUB_ACK',[sender,Date.now(),httpd.status,httpd.responseText]]]);
      }
      httpd.addEventListener('load',  httpd_events, false);
      httpd.addEventListener('error', httpd_events, false);
      httpd.addEventListener('abort', httpd_events, false);
      httpds[sender] = [httpd, httpd_events];
    }
    function destroy_httpd(sender){
      if (sender in httpds) {
        var httpd = httpds[sender][0];
        var httpd_events = httpds[sender][1];
        httpd.removeEventListener('load',  httpd_events, false);
        httpd.removeEventListener('error', httpd_events, false);
        httpd.removeEventListener('abort', httpd_events, false);
        delete httpds[sender];
      }
    }
    function make_iframe(domain,url){
      var ifrm = cnst.init('left:200px:bottom:200px:display:none:Show');
//      var ifrm = cnst.init('left:200px:bottom:200px:' + ((pref.debug_mode['0'])? '' : 'display:none:') + 'Show');
//      var ifrm = cnst.init('left:200px:bottom:200px:Show');
      ifrm.innerHTML = '<iframe name=' + domain + '></iframe>';
      iframes[domain] = window.open((site2[domain].home!=='')? site2[domain].home : url, domain);
      send_message(domain,[['SUBFRAME_INIT']],iframes[domain]);
    }
    function onload_from_sw_cache_check(key,value,args) {
      if (value!==null) {
//        var date = value[0];
//        var req_date = Date.now() - args[4]*1000;
//        if (date>req_date) {onload_from_sw_cache(key,value,args);return;}
        if (args[4]===true || value.date > Date.now() - args[4]*1000) {onload_text(args[0],value,true);return;} // date check.
      }
      get_req(args[0],args[1],args[2],args[3],false,args[5]);
    }
    function onload_text(sender,value,from_cache) {
      if (req[sender].data_type==='html') {
        value.response = parser.parseFromString(value.responseText, 'text/html');
        delete value.responseText;
      } else if (req[sender].data_type==='json') {
        value.response = (value.status==200)? JSON.parse(value.responseText) : value.responseText;
      }
      onload_local(sender,value,from_cache);
      value.response = null;
    }
    function onload_local(sender,value,from_cache) {
      var callback = req[sender].callback;
      var callback_arg = req[sender].callback_arg;
      var key = req[sender].key;
      var cache_write = req[sender].sw_cache_write;
      var data_type = req[sender].data_type;
      delete req[sender]; // patch
//      if (!from_cache && data_type==='html') {
//        doc = parser.parseFromString(value.responseText, 'text/html');
//        site2.common.remove_by_tagname(doc,'script');
//        doc.getElementsByTagName('head')[0].innerHTML = '';
////        value = {date:value.date, status:value.status, responseText:serializer.serializeToString(doc)};
//      }
//      if (!from_cache && cache_write) {
////        caches[key] = [date, value.status, response_txt];
////        setTimeout(function(){delete caches[key];},10000);
////        if (pref.info_server && brwsr.sw_cache && value.status==200) brwsr.sw_cache.setItem(key,[date, response_txt]);
////        if (pref.info_server && brwsr.sw_cache && value.status==200) brwsr.sw_cache.setItem(key,[date, value.status, response_txt]);
//        if (pref.info_server && brwsr.sw_cache && value.status==200) {
//          if (data_type==='html') value = {date:value.date, status:value.status, responseText:serializer.serializeToString(doc)};
//          brwsr.sw_cache.setItem(key,value);
//        }
//      }
//      if (data_type==='html') {value.response = doc; delete value.responseText;} // trial patch.
//      else if (data_type==='json') {value.response = JSON.parse(value.responseText); delete value.responseText;}
//      callback(key, value, callback_arg);

      if (!from_cache && data_type==='html' && value.response) {
//        site2.common.remove_by_tagname(value.response,'script');
if (!pref.test_mode['1']) {
//        var dbt = common_func.name2domainboardthread(key,true);
        var dbt = key.split(',');
        site2[dbt[0]].preprocess_doc(value.response);
  if (pref.test_mode['4']) {
    site2[dbt[0]].remove_posts(value.response,pref.test_mode.num);
    site2.common.remove_double_br(value.response);
  }
}
        if (value.response.getElementsByTagName('head')[0]) value.response.getElementsByTagName('head')[0].innerHTML = '';
      }
//var check_perf = ['http_req :', performance.now()];
      if (!from_cache && cache_write) {
        if (pref.info_server && brwsr.sw_cache && value.status==200) {
          if (data_type==='html') site2.common.remove_by_tagname(value.response,'script');
          var value_sw_cache = (data_type==='html')? {date:value.date, status:value.status, responseText:serializer.serializeToString(value.response)}
                                                   : {date:value.date, status:value.status, responseText:JSON.stringify(value.response)};
//check_perf.push(performance.now());
          brwsr.sw_cache.setItem(key,value_sw_cache);
//check_perf.push(performance.now());
        }
      }
      callback(key, value, callback_arg);
//if (sender==='catalog') common_func.perf_out(check_perf);
    }
    function get_req(sender,domain,url,key,sw_cache,data_type){
//      if (caches[key]) setTimeout(function(){onload_local(sender,{date: caches[key][0], status: caches[key][1], responseText: caches[key][2]},true);},0); // this make racing condition at checking page in catalog.
      if ((sw_cache===true || (typeof(sw_cache)==='number' && sw_cache!=0)) && brwsr.sw_cache)
        brwsr.sw_cache.trygetItem(key,onload_from_sw_cache_check,[sender,domain,url,key,sw_cache,data_type]);
      else {
        if (domain==site.nickname || pref.catalog_cross_domain_connection=='direct') {
          if (httpds[sender]==undefined) make_httpd(sender);
          httpds[sender][0].open('GET', url, true);
          httpds[sender][0].responseType = (data_type==='html')? 'document' : ((data_type==='json')? 'json' : 'text');
          httpds[sender][0].send(null);
        } else {
          if (!iframes[domain]) make_iframe(domain,url);
          send_message(domain,[['SUB_GET',[sender,domain,url,key,sw_cache,'text']]]);
        }
      }
    }
    return {
      get: function (sender,key,url,callback,sw_cache,sw_cache_write,callback_arg){
        var dbt = (key.indexOf(',')==-1)? common_func.name2dbt(key): key.split(',');
        if (url==='') url = site2[dbt[0]].make_url4(dbt);
        else if (typeof(url)==='string') url = [ url, 'raw'];
        key = dbt.join(',');
        req[sender] = {url:url[0], callback:callback, key:key, sw_cache:sw_cache, sw_cache_write:sw_cache_write, callback_arg:callback_arg, data_type:url[1]};
        get_req(sender,dbt[0],url[0],key,sw_cache,url[1]);
      },
////////      get: function (sender,key,url,callback,sw_cache,sw_cache_write,callback_arg){ // working code.
////////        var dbt = cnst.name2domainboardthread(key,true);
////////        key = dbt[0]+dbt[1]+dbt[2];
////////        if (url==='')
////////          if (dbt[2][0]==='c' || dbt[2][0]==='p' || dbt[2][0]==='j') url = site2[dbt[0]].make_url(dbt[1],parseInt(dbt[2].substr(1),10),dbt[2][0]);
////////          else url = [site2[dbt[0]].make_url3(dbt[1],dbt[2]), (dbt[2][0]!=='t')? 'html' : 'json'];
////////        if (typeof(url)==='string') url = [ url, 'raw'];
////////        req[sender] = {url:url[0], callback:callback, key:key, sw_cache:sw_cache, sw_cache_write:sw_cache_write, callback_arg:callback_arg, data_type:url[1]};
////////        get_req(sender,dbt[0],url[0],key,sw_cache,url[1]);
////////      },
      close:   function(sender){destroy_httpd(sender);},
      sub_get: function(arg){get_req(arg[0],arg[1],arg[2],arg[3],arg[4],arg[5]);},
      sub_ack: function(arg){
        pool = {date: arg[1], status: arg[2], responseText: arg[3]};
        onload_text(arg[0],pool,false);
      },
      remote : function(){local=false;}
    };
  })();

//  var http_req = (function(){ // working code, but chokes when and err occur.
//    var reqs = [];
//    var caches = {}; // prevent occuring multiple access to the same url in short time.
//    var httpd = new XMLHttpRequest();
//    var httpd_events = function(){onload_local(httpd.status,httpd.responseText);}; // for local
//    httpd.addEventListener('load',  httpd_events, false);
//    httpd.addEventListener('error', httpd_events, false);
//    httpd.addEventListener('abort', httpd_events, false);
//    
//    function onload_local(status,response_txt) {
//      var req = reqs[0];
//
//      if (req[1]!=null) req[1](status, response_txt);
//        if (pref.info_server && brwsr.sw_cache)
//          brwsr.sw_cache.setItem(req[2]+req[3]+req[4],JSON.stringify([Date.now(), response_txt]));
//
//      prep_next();
//    }
//    function prep_next() {
//      reqs.shift();
//      if (reqs.length!=0) req_get(true); // javascript doesn't allow multiphe threads in a program, so this works well.
//    }
//    function req_get(force) {
//      if (!force && reqs.length>=2) return;
//      var url = reqs[0][0];
//      if (reqs[0][2]==site.nickname || pref.catalog_cross_domain_connection=='direct') {
//        httpd.open('GET', url, true);
//        httpd.send(null);
//      } else {
//        var domain = reqs[0][2];
//        if (!iframes[domain]) {
////          iframes[domain] = [window.open(url,domain), 0];
////          var ifrm = cnst.init('left:300px:bottom:300px:Show');
//          var ifrm = cnst.init('left:300px:bottom:300px:display:none:Show');
//          ifrm.innerHTML = '<iframe name=' + domain + '></iframe>';
//          iframes[domain] = [window.open(url,domain), 0];
//          send_message(domain,[['SUBFRAME_INIT']]);
//        }
//        send_message(domain,[['SUB_GET',reqs[0]]]);
//        iframes[domain][1]++;
//      }
//    }
//    return {
//      get: function(url,callback,domain,board,page,sw_cache,sender){
//        reqs.push([url,callback,domain,board,page,sw_cache,sender]);
//        req_get(false);
//      },
//      remote: function(){
//        httpd.removeEventListener('load',  httpd_events, false);
//        httpd.removeEventListener('error', httpd_events, false);
//        httpd.removeEventListener('abort', httpd_events, false);
//        httpd_events = function(){
//          send_message('parent',[['SUB_ACK',httpd.status, httpd.responseText]]);
//          prep_next();
//        };
//        httpd.addEventListener('load',  httpd_events, false);
//        httpd.addEventListener('error', httpd_events, false);
//        httpd.addEventListener('abort', httpd_events, false);
//      },
//      onload_local: onload_local
//    };
//  })();

  var cnst = (function(){
    function opacity(pn, increase){
      var op = parseFloat(pn.style.opacity);
      if (isNaN(op)) op=1;
      if (increase) pn.style.opacity = (op+0.1>=1)? 1 : op+0.1;
      else if (!increase) pn.style.opacity = (op-0.1<=0.1)? 0.1: op-0.1;
    }
    function rollup(tb,pn,rollup_func,rolldown_func){
      if (pn.style.display=='none') { // for dollchan
        tb.style.width = ''; // means 'auto'
        pn.style.display = ''; // for dollchan
        rolldown_func();
      } else {
        tb.style.width = tb.offsetWidth + 'px'; // for dollchan
        pn.style.display = 'none'; // for dollchan
        rollup_func();
      }
    }
    function maximize(pn,tb,req,state,callback_func){
      common_func.overwrite_prop(tb.childNodes[1].childNodes[state[0]].style,{display:'inline'});
      if (state[0]==2) state = [req, pn.style.left, pn.style.top, pn.childNodes[1].style.width, pn.childNodes[1].style.height];
      else state[0] = req;
      if (req==3) { // maximize
        var header_height = site.header_height();
        common_func.overwrite_prop(pn.style, {left:'0px', top:header_height + 'px', position:'fixed', resize:'none'});
        common_func.overwrite_prop(pn.childNodes[1].style,
          {width: document.documentElement.clientWidth + 'px', height: document.documentElement.clientHeight - tb.offsetHeight - header_height + 'px', resize:'none'});
      } else if (req==2){ // float
        common_func.overwrite_prop(pn.style, {left:state[1], top:state[2], position:'fixed', resize:'both'});
        common_func.overwrite_prop(pn.childNodes[1].style, {width:state[3], height:state[4], resize:'both'});
      } else {
//        var ref = site2[site.nickname].embed_to[site.whereami][(req==0)?'top':'bottom'];
        var ref = site.embed_to[(req==0)?'top':'bottom'];
        if (ref){
          common_func.overwrite_prop(pn.style, {left:'auto', top:'auto', position:'static', resize:'none'});
          common_func.overwrite_prop(pn.childNodes[1].style, {width:'auto', height:'auto', resize:'none'});
          ref.parentNode.insertBefore(pn,ref);
        }
      }
      common_func.overwrite_prop(tb.childNodes[1].childNodes[req].style,{display:'none'});
      if (callback_func) callback_func();
      return state;
    }
    var drag_sx;
    var drag_sy;
//    var drag_cursor_style;
    function div_dragstart(e){
      drag_sx = e.screenX;
      drag_sy = e.screenY;
//      drag_cursor_style = pn.style.cursor;
//      pn.style.cursor = 'move';
      e.dataTransfer.setData('text/plain', ''); // for FF. CH doesn't require this.
//      e.preventDefault();
//      e.stopPropagation();
    }
    function div_dragend(e){
//      console.log('drag_end');
//      e.currentTarget.style.left   = (parseInt(e.currentTarget.style.left.replace(/px/,''))   + e.screenX - drag_sx) + 'px';
      if (e.currentTarget.style.left!='') e.currentTarget.style.left   = (parseInt(e.currentTarget.style.left.replace(/px/,''))   + e.screenX - drag_sx) + 'px';
      else e.currentTarget.style.right = (parseInt(e.currentTarget.style.right.replace(/px/,''))   - e.screenX + drag_sx) + 'px';
      if (e.currentTarget.style.bottom!='') e.currentTarget.style.bottom = (parseInt(e.currentTarget.style.bottom.replace(/px/,'')) - e.screenY + drag_sy) + 'px'; // from bottom.
      else e.currentTarget.style.top = (parseInt(e.currentTarget.style.top.replace(/px/,'')) + e.screenY - drag_sy) + 'px';
//      pn.style.cursor = drag_cursor_style;
    }
    function div_scroll(e){
      var val = (!brwsr.ff)? e.wheelDelta : -e.detail*40;
      if (e.currentTarget.style.bottom!='') e.currentTarget.style.bottom = (parseInt(e.currentTarget.style.bottom.replace(/px/,'')) - val) + 'px'; // from bottom.
      else e.currentTarget.style.top = (parseInt(e.currentTarget.style.top.replace(/px/,'')) + val) + 'px';
      e.preventDefault();
    }
    var tile = {
      left   : 0,
      bottom : 0,
      last_pn: null, // CAUTION. grep last pn permanently.
    };
    return {
      init2: function(obj){
        return this.init(obj.func_str,obj.rolldown_func,obj.rollup_func,obj.exit_func,obj.maximize_func,obj.pn_st);
      },
      init: function(func_str,rolldown_func,rollup_func,exit_func,maximize_func,site_settings){
        var pn = document.createElement('span');
        if (site_settings) {
          pn.textContent = ' '+func_str.replace(/.*:button:/,'').replace(/:.*/,'');
          pn.setAttribute('style','cursor:pointer');
          site_settings.appendChild(document.createTextNode(' '));
          site_settings.appendChild(pn);
          return pn;
        }
//        var pn = document.createElement('div');
        if (!pn.style) pn.style = {};
        pn.style.position = 'fixed';
        pn.draggable = true;
        pn.style.padding = '0px';
        var funcs = func_str.split(':');
        var i=0;
        if (funcs[0]!='pop') {
          pn.style.background = '#e5ecf9';
          pn.style.color = '#000000';
          pn.style.fontWeight = 'normal';
          pn.style.border = '1px solid blue';
//          pn.style.border = 'none';
        } else {
          if (!brwsr.ff) pn.addEventListener('mousewheel', div_scroll, false);
          else pn.addEventListener('DOMMouseScroll', div_scroll, false);
          pn.name = 'catalog_pop';
          i=1;
        }
        var rollup_func_tb = null;
        var tgt = pn;
        var funcs = func_str.split(':');
        while (i<funcs.length) {
          var arg = funcs[i++];
          if (arg=='tb') {
            pn.style.background = '#b5ccf9';
            pn.innerHTML = '<div>' +
              '<div style="float: left"><button type="button">-</button><button type="button"><</button><button type="button">></button><span>&emsp;</span></div>' +
//              '<div style="float: right"><button type="button">[]</button><button type="button">X</button></div>' +
              '<div style="float: right"><button style="display:inline">^</button><button style="display:inline">_</button><button style="display:none">o</button><button style="display:inline">[]</button><button>X</button></div>' +
              '<div></div>' +
              '</div>' +
              '<div style="background: #e5ecf9; margin: 0px 3px 3px 3px"></div>';
//            pn.innerHTML = '<div><div style="float: left"><button type="button">-</button><button type="button"><</button><button type="button">></button></div><div style="float: right"><button type="button">X</button></div><div></div></div><div style="background: #e5ecf9; margin: 0px 3px 3px 3px"></div>'
            var tb = pn.childNodes[0];
            tb.childNodes[2].style.height = tb.childNodes[0].offsetHeight + 'px';
            tb.childNodes[0].style.cursor = 'move';
            tb.childNodes[2].style.cursor = 'move';
            rollup_func_tb = function(){rollup(pn,pn.childNodes[1],rollup_func,rolldown_func);};
            tb.childNodes[0].childNodes[0].onclick = rollup_func_tb;
            tb.childNodes[0].childNodes[1].onclick = function(){opacity(pn, false);};
            tb.childNodes[0].childNodes[2].onclick = function(){opacity(pn, true);};
            tb.childNodes[0].childNodes[3].ondblclick = rollup_func_tb;
            tb.childNodes[2].ondblclick = rollup_func_tb;
            var maximize_state = [2];
            tb.childNodes[1].childNodes[0].onclick = function(){maximize_state = maximize(pn,tb,0,maximize_state,maximize_func);}; // can reduce footprint if 'prototype' is used.
            tb.childNodes[1].childNodes[1].onclick = function(){maximize_state = maximize(pn,tb,1,maximize_state,maximize_func);};
            tb.childNodes[1].childNodes[2].onclick = function(){maximize_state = maximize(pn,tb,2,maximize_state,maximize_func);};
            tb.childNodes[1].childNodes[3].onclick = function(){maximize_state = maximize(pn,tb,3,maximize_state,maximize_func);};
            tb.childNodes[1].childNodes[4].onclick = exit_func;
//            if (brwsr.ff) {
            pn.draggable = false;
            tb.childNodes[0].draggable = true;
            tb.childNodes[2].draggable = true;
//            }
            tgt = pn.childNodes[1];
          } else if (arg=='txt' || (brwsr.ff && arg=='button')) {
            tgt.appendChild(document.createTextNode(funcs[i++]));
            tgt.style.cursor = 'pointer';
            tgt.style.padding = '2px 5px 2px 5px';
          } else if (arg=='button') {
            tgt.innerHTML = '<input type="button" value="' + funcs[i++] + '">';
//            tgt.innerHTML = '<button draggable="true">' + funcs[++] + '</button>';
            tgt.style.padding = '0';
            tgt.style.border = '0';
            tgt.style.background = 'none';
          } else if (arg=='Show2') {
            if (site.root_body!==site.root_body2 && site.root_body2) {
              pn.style.position = 'static';
              site.root_body2.appendChild(pn);
            } else site.root_body.appendChild(pn);
          } else if (arg=='Show') site.root_body.appendChild(pn);
          else if (arg=='tile') {
            if (funcs[i++]=='set') {
              if (funcs[i]=='left') {tile[funcs[i]] = parseInt(pn.style[funcs[i]].replace(/px/,''),10) + pn.offsetWidth;i++;}
              else {tile[funcs[i]] = parseInt(pn.style[funcs[i]].replace(/px/,''),10) + pn.offsetHeight;i++;}
            } else {pn.style[funcs[i]] = tile[funcs[i]]+'px';i++;}
//            console.log(tile);
          } else tgt.style[arg] = funcs[i++];
        }
        pn.addEventListener('dragstart', div_dragstart, false);
//        pn.addEventListener('dragstart', div_dragstart, true);
        pn.addEventListener('dragend', div_dragend, false);
        tile.last_pn = pn;
        return (rollup_func_tb)? [pn,rollup_func_tb] : pn;
      },
      tile_set_bottom: function(){if (tile.last_pn) tile.bottom = tile.last_pn.offsetHeight;},
      tile_set_left: function(){if (tile.last_pn) tile.left = tile.last_pn.offsetWidth;},
      bottom_top: function(pn){
        if (pn.style.bottom) {
          pn.style.top = (window.innerHeight - parseInt(pn.style.bottom.replace(/px/,''),10) - pn.offsetHeight) + 'px';
          pn.style.bottom = '';
        }
        if (pn.style.right) {
          pn.style.left = (window.innerWidth - parseInt(pn.style.right.replace(/px/,''),10) - pn.offsetWidth) + 'px';
          pn.style.right = '';
        }
      },
      void_func: function(){},
      drag_sx : function(){return drag_sx;},
      drag_sy : function(){return drag_sy;},
      div_destroy: function(pn,child_of_body){
        if (pref.tooltip.show) pref_func.tooltips.remove_hier(pn);
        if (child_of_body) pn.parentNode.removeChild(pn);
        pn.removeEventListener('dragstart', div_dragstart, false);
        pn.removeEventListener('dragend', div_dragend, false);
        if (pn.name=='catalog_pop') {
          if (!brwsr.ff) pn.removeEventListener('mousewheel', div_scroll, false);
          else pn.removeEventListener('DOMMouseScroll', div_scroll, false);
        }
        return null;
      },
      add_to_tb: function(pn,str){
        var pn_2 = document.createElement('div');
        pn_2.style.float = 'right'; // doesn't work on FF
        pn_2.style.resize = 'none';
        pn_2.style.overflow = 'visible';
        pn_2.innerHTML = str;
        pn.childNodes[0].insertBefore(pn_2,pn.childNodes[0].childNodes[pn.childNodes[0].childNodes.length-1]);
//        if (brwsr.ff) pn.childNodes[0].childNodes[2].setAttribute('style','float: right');
        if (brwsr.ff) pn_2.setAttribute('style','float: right');
        return pn_2;
      },
      show_hide: function(pn,pn_parent){
        if (pn.style.display=='none') {
          pn.style.display='';
          if (pn_parent) pn_parent.style.height = parseInt(pn_parent.style.height.replace(/px/,''),10) - pn.offsetHeight + 'px'; // May not work? It depends on the timing of invoking rendering engine. Chrome is ok.
        } else {
          if (pn_parent) pn_parent.style.height = parseInt(pn_parent.style.height.replace(/px/,''),10) + pn.offsetHeight + 'px';
          pn.style.display='none';
        }
      },
//      rollup: function(tb,pn){rollup(tb,pn,cnst.void_func,cnst.void_func);},
      name2domainboardthread: common_func.name2domainboardthread,
//      name2domainboardthread: function(name,fill){
//        var thread = name.replace(/[^\/]*\//g,'');
//        var domain = name.replace(/\/.*/,'');
//        var board  = name.replace(new RegExp('^'+domain),'').replace(new RegExp(thread+'$'),'');
//        if (thread==domain)
//          if (thread.search(/[^0-9]/)!=-1) thread ='';
//          else domain = '';
//        if (fill) {
//          if (domain==='') domain = site.nickname;
//          if (board==='') board = site.board;
//        }
//        return [domain,board,thread];
//      },
      get_time: function(){
        var now = new Date();
        var hour = now.getHours();
        var min = now.getMinutes();
        var sec = now.getSeconds();
        if(hour<10) hour = '0' + hour;
        if(min<10)  min  = '0' + min;
        if(sec<10)  sec  = '0' + sec;
        return hour + ':' + min + ':' + sec;
      },
      make_destroy: function(parent,key,func_make,func_destroy){
        if (!parent[key]) parent[key] = func_make();
        else parent[key] = func_destroy();
      },
      make_popup: function(parent,tgt,html,onchange_func){
        parent[tgt] = cnst.init('left:0px:tile:get:bottom:Show:tb',cnst.void_func,cnst.void_func, function(){
            parent[tgt] = cnst.div_destroy(parent[tgt], true);
          },cnst.void_func)[0];
        parent[tgt].childNodes[1].innerHTML = html;
        pref_func.add_onchange(parent[tgt].childNodes[1],onchange_func);
      },
    };
  })();

////  function Cnst2(func_str,funcs_args){ // rolldown, rollup, exit, maximize // test for prototype base coding.
////    var pn = document.createElement('div');
////    if (!pn.style) pn.style = {};
////    pn.style.position = 'fixed';
////    pn.draggable = true;
////    pn.style.padding = '0px';
////    var funcs = func_str.split(':');
////    var i=0;
////    if (funcs[0]!='pop') {
////      pn.style.background = '#e5ecf9';
////      pn.style.color = '#000000';
////      pn.style.fontWeight = 'normal';
////      pn.style.border = '1px solid blue';
//////      pn.style.border = 'none';
////    } else {
////      pn.addEventListener(brwsr.mousewheel, div_scroll, false);
////      pn.name = 'catalog_pop';
////      i=1;
////    }
////    this.pn = pn;
////
////    var tgt = pn;
////    var funcs = func_str.split(':');
////    while (i<funcs.length) {
////      var arg = funcs[i++];
////      if (arg=='tb') {
////        pn.style.background = '#b5ccf9';
////        pn.innerHTML = '<div>' +
////          '<div style="float: left"><button name="rollup">-</button><button name="opacity,-0.1"><</button><button name="opacity,0.1">></button><span>&emsp;</span></div>' +
////          '<div style="float: right"><button name="embed_top" style="display:inline">^</button><button name="embed_bottom" style="display:inline">_</button><button name="float" style="display:none">o</button><button name="maximize" style="display:inline">[]</button><button name="exit">X</button></div>' +
////          '<div></div>' +
////          '</div>' +
////          '<div style="background: #e5ecf9; margin: 0px 3px 3px 3px"></div>';
////        var tb = pn.childNodes[0];
////        tb.childNodes[2].style.height = tb.childNodes[0].offsetHeight + 'px';
////        tb.childNodes[2].ondblclick = (function(myself){return function(){myself.button_click("rollup");};})(this);
//////        tb.childNodes[0].childNodes[3].ondblclick = tb.childNodes[2].ondblclick;
////        pn.draggable = false;
////        tb.childNodes[0].draggable = true;
////        tb.childNodes[2].draggable = true;
////        tb.childNodes[0].style.cursor = 'move';
////        tb.childNodes[2].style.cursor = 'move';
////        tgt = pn.childNodes[1];
////        this.tb = tb;
////        this.opacity = 1;
////        this.rolluped = false;
////        this.state = ['float'];
////        this.button_click_event = (function(myself){return function(){myself.button_click.call(myself,this.name);};})(this);
////        this.funcs = {};
////        common_func.overwrite_prop(this.funcs,funcs_args);
////        var buttons = pn.getElementsByTagName('button');
////        for (var j=0;j<buttons.length;j++) buttons[j].onclick = this.button_click_event;
////        this.pn_1 = pn.childNodes[1];
////      } else if (arg=='txt' || (brwsr.ff && arg=='button')) {
////        tgt.appendChild(document.createTextNode(funcs[i++]));
////        tgt.style.cursor = 'pointer';
////        tgt.style.padding = '2px 5px 2px 5px';
////      } else if (arg=='button') {
////        tgt.innerHTML = '<input type="button" value="' + funcs[i++] + '">';
//////        tgt.innerHTML = '<button draggable="true">' + funcs[++] + '</button>';
////        tgt.style.padding = '0';
////        tgt.style.border = '0';
////        tgt.style.background = 'none';
////      } else if (arg=='Show2') {
////        if (site.root_body!==site.root_body2 && site.root_body2) {
////          pn.style.position = 'static';
////          site.root_body2.appendChild(pn);
////        } else site.root_body.appendChild(pn);
////      } else if (arg=='Show') site.root_body.appendChild(pn);
////      else if (arg=='tile') {
////        if (funcs[i++]=='set') {
////          if (funcs[i]=='left') {this.tile[funcs[i]] = parseInt(pn.style[funcs[i]].replace(/px/,''),10) + pn.offsetWidth;i++;}
////          else {this.tile[funcs[i]] = parseInt(pn.style[funcs[i]].replace(/px/,''),10) + pn.offsetHeight;i++;}
////        } else {pn.style[funcs[i]] = this.tile[funcs[i]]+'px';i++;}
////      } else tgt.style[arg] = funcs[i++];
////    }
////    pn.addEventListener('dragstart', this.div_dragstart, false);
//////    pn.addEventListener('dragstart', this.div_dragstart, true);
////    pn.addEventListener('dragend', this.div_dragend, false);
////  }
////
////  Cnst2.prototype = {
////    tile : {lef: 0, bottom: 0},
////    button_click : function(name){
////      if (name.indexOf('opacity')!=-1) {
////        this.opacity += parseFloat(name.substr(name.indexOf(',')+1),10);
////        if (this.opacity>1) this.opacity = 1;
////        else if (this.opacity<0.1) this.opacity = 0.1;
////        this.pn.style.opacity = this.opacity;
////      } else if (name.indexOf('rollup')!=-1) {
////        if (this.rolluped) {
////          this.tb.style.width = ''; // means 'auto'
////          this.pn_1.style.display = ''; // for dollchan
////          if (this.funcs.rolldown) this.funcs.rolldown();
////        } else {
////          this.tb.style.width = this.tb.offsetWidth + 'px'; // for dollchan
////          this.pn_1.style.display = 'none'; // for dollchan
////          if (this.funcs.rollup) this.funcs.rollup();
////        }
////        this.rolluped = !this.rolluped;
////      } else if (['embed_top','embed_bottom','float','maximize'].indexOf(name)!=-1) {
////        common_func.overwrite_prop(this.tb.childNodes[1].getElementsByTagName('*')[this.state[0]].style,{display:'inline'});
////        if (this.state[0]=='float') this.state = [name, this.pn.style.left, this.pn.style.top, this.pn.childNodes[1].style.width, this.pn.childNodes[1].style.height];
////        else this.state[0] = name;
////        if (name=='maximize') {
////          var header_height = site.header_height();
////          common_func.overwrite_prop(this.pn.style, {left:'0px', top:header_height + 'px', position:'fixed', resize:'none'});
////          common_func.overwrite_prop(this.pn.childNodes[1].style,
////            {width: document.documentElement.clientWidth + 'px', height: document.documentElement.clientHeight - this.tb.offsetHeight - header_height + 'px', resize:'none'});
////        } else if (name=='float'){
////          common_func.overwrite_prop(this.pn.style, {left:this.state[1], top:this.state[2], position:'fixed', resize:'both'});
////          common_func.overwrite_prop(this.pn.childNodes[1].style, {width:this.state[3], height:this.state[4], resize:'both'});
////        } else {
////          var ref = site.embed_to[(name==='embed_top')?'top':'bottom'];
////          if (ref){
////            common_func.overwrite_prop(this.pn.style, {left:'auto', top:'auto', position:'static', resize:'none'});
////            common_func.overwrite_prop(this.pn.childNodes[1].style, {width:'auto', height:'auto', resize:'none'});
////            ref.parentNode.insertBefore(this.pn,ref);
////          }
////        }
////        common_func.overwrite_prop(this.tb.childNodes[1].getElementsByTagName('*')[this.state[0]].style,{display:'none'});
////        if (this.funcs.maximize) this.funcs.maximize();
////      } else if (name==='exit') this.funcs.exit();
////    },
////    drag_sx: null,
////    drag_sy: null,
////    div_dragstart: function(e){
//////    var drag_cursor_style;
////      this.drag_sx = e.screenX;
////      this.drag_sy = e.screenY;
//////      drag_cursor_style = pn.style.cursor;
//////      pn.style.cursor = 'move';
////      e.dataTransfer.setData('text/plain', ''); // for FF. CH doesn't require this.
//////      e.preventDefault();
//////      e.stopPropagation();
////    },
////    div_dragend: function(e){
////      if (e.currentTarget.style.left!='') e.currentTarget.style.left   = (parseInt(e.currentTarget.style.left.replace(/px/,''))   + e.screenX - this.drag_sx) + 'px';
////      else e.currentTarget.style.right = (parseInt(e.currentTarget.style.right.replace(/px/,''))   - e.screenX + this.drag_sx) + 'px';
////      if (e.currentTarget.style.bottom!='') e.currentTarget.style.bottom = (parseInt(e.currentTarget.style.bottom.replace(/px/,'')) - e.screenY + this.drag_sy) + 'px'; // from bottom.
////      else e.currentTarget.style.top = (parseInt(e.currentTarget.style.top.replace(/px/,'')) + e.screenY - this.drag_sy) + 'px';
//////      pn.style.cursor = drag_cursor_style;
////    }
////  }

  var timer_obj;
  var chart_obj;
  var setting_obj;
  var post_form_obj;
  var wafd = null;
  var catalog_obj;
  var cnst_obj = (function(){
    if (site.settings) {
      site.settings.innerHTML = '<span>[CC</span><span></span>]';
      site.settings.setAttribute('style','float:right;');
      var pn_st = site.settings.childNodes[1];
      site.settings.childNodes[0].setAttribute('style','cursor:pointer');
      site.settings.childNodes[0].onclick = function(){cnst.show_hide(pn_st);};
      site.settings.childNodes[1].setAttribute('style','display:none');
    }
    if (site.features.catalog && pref.features.catalog) {
      if (!pref.catalog.embed_page || site.whereami!=='page') {
        var pn12_str = (pref.catalog.embed && site.whereami==='catalog')? 'Frame' : 'Catalog';
        var pn12 = cnst.init2({func_str:'left:0px:bottom:0px:button:'+pn12_str+':Show2:tile:set:left',pn_st:pn_st});
      }
      catalog_obj = make_catalog_obj(pn12);
    }
    cnst.tile_set_left();
    if (site.features.setting && pref.features.setting) {
      var pn13 = cnst.init2({func_str:'tile:get:left:tile:get:bottom:button:settings:Show2:tile:set:left',pn_st:pn_st});
      pn13.addEventListener('click', pref_func.settings.show_hide, false);
    }
    if (site.features.graph && pref.features.graph) {
      var pn1 = cnst.init2({func_str:'tile:get:left:tile:get:bottom:button:Graph:Show2:tile:set:left',pn_st:pn_st});
      chart_obj = make_chart_obj(pn1);
    }
    if (site.features.setting2 && pref.features.setting2) {
      var pn8 = cnst.init2({func_str:'tile:get:left:tile:get:bottom:button:settings2:Show2:tile:set:left',pn_st:pn_st});
      setting_obj = make_setting_obj(pn8);
    }
    if (site.features.postform && pref.features.postform && site.postform!=null) {
//      if (site2[site.nickname].postform_activation) site2[site.nickname].postform_activation();
      wafd = make_wafd();
      var pn9 = cnst.init2({func_str:'tile:get:left:tile:get:bottom:button:post_form:Show2:tile:set:left',pn_st:pn_st});
      post_form_obj = make_post_form_obj(pn9);
    }
    if (site.features.debug && pref.features.debug) {
      var pn_debug_button = cnst.init2({func_str:'tile:get:left:tile:get:bottom:button:debug:Show2:tile:set:left',pn_st:pn_st});
      make_debug_obj(pn_debug_button);
//  var pn_debug_out    = cnst.init('left:200px:bottom:50px:txt:debug_out');
    }
    if (site.features.page && pref.features.page) {
//      var pn0 = cnst.init('tile:get:left:tile:get:bottom:txt:init:Show2:tile:set:bottom');
      var pn0 = cnst.init2({func_str:'tile:get:left:tile:get:bottom:txt:init:Show2',pn_st:pn_st});
      timer_obj  = make_timer_obj(pn0);
    }
    cnst.tile_set_bottom();
    if (site.features.catalog && pref.features.catalog) if (pref.catalog.board.board_tags_same) pref_func.settings.onchange_funcs['tag.same_tag_refresh']();
  })();

  function make_uip_tracker (){
    var base_thread = site2[site.nickname].wrap_to_parse.get(document, site.nickname, site.board, 'thread_html', {thread:site.myself})[0];
    site.thread = site.get_ops(document)[0];
//    var url = site.protocol + '//a.4cdn.org' + site.board +'thread/' + site.thread + '.json';
//    var url2= site.protocol + '//a.4cdn.org' + site.board +'catalog.json';
//    var url = site2[site.nickname].get_json_url_thread(site.board,site.thread);
    var url2= site2[site.nickname].get_json_url_catalog(site.board);
    var key = site.nickname + site.board + site.thread;
    var post_uip = [];
    var last_updated = [0,1,1]; //no,posts,uips
    var posts_no = {};
    var waste_count = 0;
    var interval_pref = pref.uip_tracker.interval;
    if (interval_pref<10) interval_pref = 10;
    var interval = interval_pref;
    var uip_tracker_id;
    uip_check();
//    function uip_check(){http_req.get('uip',key,url,uip_show,false,false);}
    function uip_check(){
      uip_tracker_id = null;    
      site2[site.nickname].uip_check(uip_show);
    }

    var threads = {};
    var threads_req = {};
    var threads_req_mutex = true;
    var threads_opened = {};
    function uip_auto_open(key,value){
//      var obj = JSON.parse(response_txt);
      var obj = site2[site.nickname].parse_json_catalog(value.responseText);
      threads['max'] = 0;
      for (var i=0;i<obj.length;i++) {
        for (var j=0;j<obj[i].threads.length;j++) {
          var no = obj[i].threads[j].no;
          threads[no] = {};
          threads[no].sub = obj[i].threads[j].sub;
          threads[no].com = obj[i].threads[j].com;
          if (threads['max']<no) threads['max']=no;
        }
      }
      uip_auto_open_check();
      threads_req_mutex = true;
    }
//    if (pref.debug_mode['0']) { // for debug
////      window.addEventListener('load',function(){console.log(new Date().toLocaleTimeString()+': load_event');},false); // can't get.
////      window.addEventListener('DOMSubtreeModified',function(){console.log(new Date().toLocaleTimeString()+': DOMSubtreeModified');},false); // get too much because of root.
//      site2[site.nickname].catalog_threads_in_page(document)[0].addEventListener('DOMSubtreeModified',function(){console.log(new Date().toLocaleTimeString()+': DOMSubtreeModified');},false); // ok.
//    }

    var observer = new MutationObserver(uip_show_from_doc);
    observer.observe(base_thread.pn, {childList: true});
    function add_dom_event_listener(){
      observer.observe(base_thread.pn, {childList: true});
    }
    function remove_dom_event_listener(){
      observer.disconnect();
    }
//    function add_dom_event_listener(){ // obsolete function. see https://developer.mozilla.org/en-US/docs/Web/Guide/Events/Mutation_events
//      base_thread.pn.addEventListener('DOMSubtreeModified',uip_show_from_doc,false);
//    }
//    function remove_dom_event_listener(){
//      base_thread.pn.removeEventListener('DOMSubtreeModified',uip_show_from_doc,false);
//    }
    add_dom_event_listener();
    function uip_auto_open_check(){
      var kwd = pref.uip_tracker.auto_open_kwd;
      if (kwd==='') kwd = '.*';
      for (var i in threads_req) {
        if (threads[i] && i>site.thread && threads_opened[i]===undefined) {
          var flag = false;
          flag |= threads[i].sub  && threads[i].sub.search(kwd) !=-1;
          flag |= threads[i].name && threads[i].name.search(kwd)!=-1;
          flag |= threads[i].com  && threads[i].com.search(kwd) !=-1;
if (pref.debug_mode['0']) console.log('auto_opener: '+i+': '+flag);
//          if (flag) window.open(site2[site.nickname].make_url3(site.board,i), site.domain+site.board+i);
          if (flag) {
            window.open(site2[site.nickname].make_url4([site.nickname, site.board, i, 'thread_html'])[0], '_blank');
//            window.open(site2[site.nickname].make_url3(site.board,i), '_blank');
            threads_opened[i] = i;
          }
          delete threads_req[i];
        } else if (threads['max']>i) delete threads_req[i];
      }
      if (Object.keys(threads_req).length!=0 && threads_req_mutex) {
        threads_req_mutex = false;
        http_req.get('uip_auto',key,url2,uip_auto_open,false,false);
      }
    }
    function uip_show(key,value){ // from http
      uip_show_2(key,value,true);
    }
    function uip_show_from_doc(key,value){ // from document
 //     uip_show_2(Date.now(),1200,'',false);
     uip_show_3();
    }
    function uip_show_3(){  // show
      remove_dom_event_listener();
      for (var i=0;i<post_uip.length;i++) {
//        var tgt_post = document.getElementById('pc'+post_uip[i][0]);
        var tgt_post = site2[site.nickname].uip_tgt_post(post_uip[i][0]);
        if (tgt_post) {
//          var post_nums = tgt_post.getElementsByClassName('postNum');
          var post_nums = site2[site.nickname].uip_post_num(tgt_post);
          var pn_uip = document.createElement('span');
          pn_uip.innerHTML = ' (<span>'+post_uip[i][2]+'</span>)';
          if (post_uip[i][4]) pn_uip.childNodes[1].setAttribute('style','color:Red');
//          if (pref.uip_tracker.deletion && post_uip[i][5]!=='') {
//            pn_deleted_posts = document.createElement('span');
//            pn_deleted_posts.innerHTML = '<span>'+ post_uip[i][5] +'</span>/';
//            pn_deleted_posts.childNodes[0].setAttribute('style','color:Red');
//            pn_uip.insertBefore(pn_deleted_posts,pn_uip.childNodes[1]);
//          }
          if (pref.uip_tracker.posts) {
            pn_posts = document.createElement('span');
//            pn_posts.innerHTML = '<span>'+ post_uip[i][1] +'</span>/';
            pn_posts.innerHTML = '<span>'+ post_uip[i][1] +'</span>' + ((post_uip[i][5]!=='')? '('+post_uip[i][5]+')' : '') + '/';
            if (post_uip[i][3]) pn_posts.childNodes[0].setAttribute('style','color:Red');
            pn_uip.insertBefore(pn_posts,pn_uip.childNodes[1]);
          }
          for (var j=0;j<post_nums.length;j++) post_nums[j].appendChild(pn_uip);
          post_uip.splice(i,1);
          i--;
        }
      }
      add_dom_event_listener();
    }
    function uip_show_2(key,value,from_http){ // from http and doc
//console.log(new Date(value.date).toLocaleTimeString()+', IN, '+from_http);
      waste_count++;
      if (value.status==200) {
//        var obj = JSON.parse(value.responseText);
        var obj = site2[site.nickname].parse_json_thread(('response' in value)? value.response : JSON.parse(value.responseText),from_http);
        var posts = obj.posts.length;
        var uips = obj.posts[posts-1]['unique_ips'];
        if (uips==0) uips = last_updated[2];
        var no = obj.posts[posts-1]['no'];
        if (pref.uip_tracker.auto_open && pref.uip_tracker.auto_open_th<=posts && last_updated[0]!=0) { // this picks up before 300th.
          if (last_updated[1]!=posts) { // skip if the previous post was deleted and the post get into.
            var pn_test = document.createElement('span');
            for (var i=last_updated[1];i<posts;i++) {
              pn_test.innerHTML = obj.posts[i].com;
              var pn_a = pn_test.getElementsByTagName('a');
              for (var j=0;j<pn_a.length;j++) {
                var flag = true;
                var tgt = pn_a[j].textContent.substr(2);
                for (var k=0;k<posts.length;k++) if (posts[k].no==tgt) {flag=false;break;}
//                if (flag) console.log('auto_opener: '+tgt);
                threads_req[tgt] = tgt;
              }
            }
            uip_auto_open_check();
          }
        }
        if (last_updated[0]!=no || last_updated[1]!=posts || last_updated[2]!=uips) {
//          last_updated = [no,posts,uips,last_updated[1]+1!=posts,last_updated[2]!=uips];
if (pref.debug_mode['0']) console.log(new Date(value.date).toLocaleTimeString()+', '+no+', '+posts+', '+uips);
          var post_hilight = (obj.posts.length<last_updated[1] || obj.posts[last_updated[1]-1]['no']!=last_updated[0]);
          var posts_deleted = '';
          if (pref.uip_tracker.deletion) {
            var posts_no_new = {};
            for (var i=0;i<obj.posts.length;i++) posts_no_new[obj.posts[i].no] = 1; // dummy;
            for (var i in posts_no) if (posts_no_new[i]===undefined) posts_deleted = posts_deleted + ((posts_deleted!=='')? ',' : '') + i;
            posts_no = posts_no_new;
if (pref.debug_mode['0'] && posts_deleted!=='') console.log('uip_deleted '+posts_deleted);
          }
          last_updated = [no,posts,uips,post_hilight,last_updated[2]!=uips,posts_deleted];
          post_uip.push(last_updated);
          waste_count = 0;
        }
        uip_show_3();
      }
      if (pref.uip_tracker.on) {
        if (from_http) {
          if (pref.uip_tracker.adaptive){
            if (waste_count==0) interval = interval_pref;
            else if (waste_count>=8) {
              waste_count=0;
              interval *= 2;
             if (interval>=3600) interval=3600;
            }
          }
//          if (value.status!=404) setTimeout(uip_check,interval*1000);
          var p0 = (value.status==200)? obj.posts[0] : null;
          if (value.status!=404 && (!p0 || (!p0['archived'] && !p0['closed']))) uip_tracker_id = setTimeout(uip_check,interval*1000);
          else uip_tracker_destroy();
        }
      } else uip_tracker_destroy();
    }
    function uip_tracker_destroy(){
      remove_dom_event_listener();
      uip_tracker = null;
//if (pref.debug_mode['0'] && uip_tracker===null) console.log('uip_tracker: stopped, '+value.status);
    }
    return function(){return uip_tracker_id;}
  }
  var uip_tracker=null;
  uip_tracker_init();
  function uip_tracker_init(){
    if (uip_tracker===null && site.features.uip_tracker && pref.features.uip_tracker && site.isthread && pref.uip_tracker.on) uip_tracker = make_uip_tracker();
    else if (!pref.uip_tracker.on) {
      if (uip_tracker) clearTimeout(uip_tracker());
      uip_tracker = null;
    }
  }

  function make_thread_reader(){
//    var base_thread = site2[site.nickname].catalog_threads_in_page(document)[0];
    var name = site.nickname+site.board+site.myself;
//    var dbt = common_func.name2domainboardthread(name);
    var dummy = {sticky:null};
    var threads = {};
    threads[name] = [];
////////    threads[name][8]  = [0,0,0,0];
    threads[name][19] = liveTag.mems.init({domain:site.nickname, board:site.board, no:site.myself})[2]; // prepare data structures.
//    threads[name][19] = [1,0,0,0,null,true,-1,0,true];
    var favicon_obj = [];
    var buf_id = null;
    function updated_buf(){if (!buf_id) buf_id = setTimeout(updated,100);}
//    var posts = {};
////////    var nof_posts = 0;
//    var init = true;
////////    var time_lastpost = 0;
    var num_of_children = 0;
////////    var myself_th = {pn:base_thread, post_no_last:-1,
////////      domain:site.nickname, board:site.board, parse_funcs:site2[site.nickname].parse_funcs['thread_html'], __proto__:site4.parse_funcs_on_demand};
    var site_live = site.nickname + ((site2[site.nickname+'_live'])? '_live' : '');
    var myself_th = site2[site.nickname].wrap_to_parse.get(document, site.nickname, site.board, 'thread_html',
                      {thread:site.myself, parse_funcs:site2[site_live].parse_funcs['thread_html']})[0];
//    var parse_obj = {domain:site.nickname, board:site.board,
//                     parse_funcs:site2[site_live].parse_funcs['thread_html'],
//                     __proto__:site4.parse_funcs_on_demand};
//    var myself_th = {pn:base_thread, __proto__:parse_obj};
//    var myself_th = {pn:base_thread, domain:site.nickname, board:site.board,
//                     parse_funcs:site2[site_live].parse_funcs['thread_html'],
//                     __proto__:site4.parse_funcs_on_demand};
////////    var regexp_anchor    = />>[0-9]+/g;
////////    var regexp_anchor_cb = />>>\/[0-9A-z_\+]+\/[0-9]+/g;
////////    var remake_own_posts = true;



    var own_posts_tracker = function(){
      var get_flag = true;
      function get_my_posts_no(){
get_flag = true;}
      function update_own_posts(posts,init){
        if (posts.length==0) return; // length check for KC.
        if (get_flag) {
          var key = pref.script_prefix + '.own_posts.' + site.board + site.myself;
          var own_posts = JSON.parse(localStorage[key] || "[]");
          var my_posts = [];
          if (!init) {
            my_posts[0] = posts[posts.length-1];
            own_posts[own_posts.length] = my_posts[0].post_no;
            localStorage[key] = JSON.stringify(own_posts);
          } else {
            var i = 0;
            var j = posts.length-1;
            while (i<own_posts.length) {
              while (j>0 && own_posts[i]>posts[j].post_no) j--;
              if (own_posts[i]===posts[j].post_no) my_posts[my_posts.length] = posts[j];
              i++;
            }
          }
          for (var i=0;i<my_posts.length;i++)
            if (pref.thread_reader.show_own_post_by==='plain') my_posts[i].pn_name.parentNode.insertBefore(document.createTextNode(' (You)'), my_posts[i].pn_name.nextSibling);
            else my_posts[i].pn_name.innerHTML = my_posts[i].pn_name.innerHTML + ' (You)';
          get_flag = false;
        }
        for (var i=0;i<posts.length;i++) site2[site.nickname].check_reply.add_you(posts[i]);
      }
      function event_submit(){
        if (this.name==='post') get_my_posts_no();
      }
      return {
        update_own_posts: update_own_posts,
        get_my_posts_no: get_my_posts_no,
        event_submit: event_submit,
      }
    };
    if (pref.thread_reader.own_posts_tracker) {
      own_posts_tracker = own_posts_tracker();
      if (!site.postform_submit) window.addEventListener('submit', own_posts_tracker.event_submit, false); // doesn't work....
    } else {
      own_posts_tracker = null;
//      if (!site.postform_submit) window.removeEventListener('submit', own_posts_tracker.event_submit, false);
    }

    var ignore_old = pref.catalog_footer_ignore_my_own_posts; // patch for showing (You), don't discard my post...
    pref.catalog_footer_ignore_my_own_posts = false;
    updated(true);
    pref.catalog_footer_ignore_my_own_posts = ignore_old;

//    threads[name][19][5] = false; // modified in check_reply
    common_func.set_value_to_root(threads[name][19],'5',false);
////////    function remake_own_posts_flag(){remake_own_posts = true;}
////////    function add_event_to_submit(pn){pn.addEventListener('click', remake_own_posts_flag, false);}
////////    function remove_event_from_submit(pn){pn.addEventListener('click', remake_own_posts_flag, false);}
//    function add_event_to_submit(pn){pn.addEventListener('click', site2[site.nickname].check_reply.remake_own_posts, false);}
//    function remove_event_from_submit(pn){pn.addEventListener('click', site2[site.nickname].check_reply.remake_own_posts, false);}
    function add_event_to_submit(pn){
      pn.addEventListener('click', site2[site.nickname].check_reply.remake_own_posts, false);
      if (own_posts_tracker) pn.addEventListener('click', own_posts_tracker.get_my_posts_no, false);
    }
    function remove_event_from_submit(pn){
      pn.addEventListener('click', site2[site.nickname].check_reply.remake_own_posts, false);
      if (own_posts_tracker) pn.removeEventListener('click', own_posts_tracker.get_my_posts_no, false);
    }
    function updated(init){
      buf_id = null;
//console.log('called');
      if (pref.thread_reader.check_num_of_children) {
        if (num_of_children>=myself_th.pn.childNodes.length) return; // KC doesn't work by this, because all of children are not posts.
          num_of_children = myself_th.pn.childNodes.length;
      }
////      myself_th.parse_funcs['pop_post_prep'](myself_th);
      site2[site.nickname].check_reply.check(myself_th, threads[name][19]);
      delete myself_th.posts;
////////      nof_posts += threads[name][19][7]; // patch
      for (var i=0;i<threads[name][19][4].length;i++)
        threads[name][19][4][i].pn.addEventListener('mouseover', favicon_check, false);
//console.log('length:'+threads[name][19][4].length);

//////////      threads[name][19][1] = 0;
////////      threads[name][19][4] = [];
////////      var flag_first = true;
////////      var post_no_last_new = myself_th.post_no_last;
////////      myself_th.parse_funcs['pop_post_prep'](myself_th);
////////      while (1) {
////////        myself_th.post = myself_th.parse_funcs['pop_post'](myself_th);
////////        if (myself_th.post && myself_th.post.post_no>myself_th.post_no_last) {
////////      
//////////      for (var i=base_thread.childNodes.length-1;i>=0;i--) { // num of posts is changed by hover and inline.
//////////        var classname = base_thread.childNodes[i].className;
//////////        if (classname && classname.indexOf('post')!=-1 && classname.indexOf('reply')!=-1) { // remove popuped posts.
//////////          var id = base_thread.childNodes[i].id;
//////////          if (!(id in posts)) {
////////          if (flag_first) {
////////            post_no_last_new = myself_th.post.post_no;
////////            if (remake_own_posts) {
////////              site2[site.nickname].prep_own_posts(); // couldn't get an event from myself, so don't miss posts from my thread.
////////              remake_own_posts = false;
////////            }
////////            time_lastpost = myself_th.post.time;
////////            flag_first = false;
////////          }
////////          nof_posts++;
//////////          posts[id] = id;
//////////          var post = myself_th.post.pn; // temporal
////////          if (!init) {
//////////            var post = base_thread.childNodes[i];
//////////            var image = post.getElementsByClassName('post-image');
//////////            image = (image[0])? image[0].src : undefined;
//////////            var body = post.getElementsByClassName('body')[0].innerHTML;
////////            var to_me  = false;
////////            var anchors = regexp_anchor.exec(myself_th.post.com);
////////            if (anchors!==null) {
////////              for (var j=0;j<anchors.length;j++) {
////////                var tgt = anchors[j].substr(2);
////////                if (site3[site.nickname].own_posts[dbt[1]+tgt]===null) {to_me = true; break;}
////////            }}
////////            if (!to_me) {
////////              anchors = regexp_anchor_cb.exec(myself_th.post.com);
////////              if (anchors!==null) {
////////                for (var j=0;j<anchors.length;j++) {
////////                  var tgt = anchors[j].substr(3);
////////                  if (site3[site.nickname].own_posts[tgt]===null) {to_me = true; break;}
////////            }}}
//////////            var anchors = body.match(/&gt;&gt;[0-9]+/g);
//////////            if (anchors) {
//////////              for (var j=0;j<anchors.length;j++) {
//////////                var tgt = anchors[j].substr(8);
//////////                if (site3[site.nickname].own_posts[dbt[1]+tgt]===null) {to_me = true; break;}
//////////            }}
//////////            if (!to_me) {
//////////              anchors = body.match(/&gt;&gt;&gt;\/[0-9A-z_\+]+\/[0-9]+/g);
//////////              if (anchors) {
//////////                for (var j=0;j<anchors.length;j++) {
//////////                  var tgt = anchors[j].substr(12);
//////////                  if (site3[site.nickname].own_posts[tgt]===null) {to_me = true; break;}
//////////            }}}
////////            threads[name][19][4].unshift(
////////              {icon: myself_th.post.op_img_url,
////////               body: myself_th.post.com,
////////               time: myself_th.post.time,
//////////               icon: image,
//////////               body: body,
//////////               time: Date.parse(post.getElementsByTagName('time')[0].getAttribute('datetime')) - pref.localtime_offset*3600000,
////////               to_me: to_me,
////////               offsetTop: myself_th.post.pn.offsetTop});
////////            if (to_me) threads[name][19][1]++;
////////          }
////////          myself_th.post.pn.addEventListener('mouseover', favicon_check_event, false);
//////////            if (time_lastpost<threads[name][19][4][0].time) time_lastpost=threads[name][19][4][0].time;
//////////          } else break;
//////////        }
//////////      }
////////
////////        } else break;
////////      }
////////      myself_th.post_no_last = post_no_last_new;

      if (!init) {
//      if (init) {init=false;buf_id=null;return;}
////////        threads[name][8][2]  = nof_posts;
//        for (var i=0;i<threads[name][19][4].length;i++) favicon_obj.push([threads[name][19][4][i].pn.offsetTop,threads[name][19][4][i]]);
//        for (var i=threads[name][19][4].length-1;i>=0;i--) favicon_obj.push([threads[name][19][4][i].pn.offsetTop,threads[name][19][4][i]]);
        for (var i=threads[name][19][4].length-1;i>=0;i--) favicon_obj.push(threads[name][19][4][i]);
//        threads[name][19][2] = nof_posts - favicon_obj.length;
        threads[name][19][2] = favicon_obj.length;

//      if (!init) { // merge with mark_newer_posts. MIGHT CAUSE UNSTABLITY???
//        var nof_posts = site2[site.nickname].get_posts(document).length; // works well in static.
//        threads[name][8][2] = nof_posts;
//        site2[site.nickname].check_reply_to_me(name,dbt,threads[name][19], document, threads[name][8], dummy);
//        for (var i=0;i<threads[name][19][4].length;i++) favicon_obj.push([site2[site.nickname].get_post_offsetTop(document,nof_posts-1-i),threads[name][19][4][i]]);

        if (threads[name][19][4].length!=0) notifier.changed(name,threads);
      }
      if (own_posts_tracker) own_posts_tracker.update_own_posts(threads[name][19][4],init);
    }
//    function favicon_check_event(){
//      this.removeEventListener('mouseover', favicon_check_event, false);
//      favicon_check();
//    }
    var ignore_scroll = false;
    var ref_height_checked = 0;
    function favicon_check(e){
      if (this===window && ignore_scroll) {ignore_scroll = false; return;}
      if (favicon_obj.length==0) return;
      var ref_height = brwsr.document_body.scrollTop;
      if (ref_height<=ref_height_checked) return;
      else ref_height_checked = ref_height;
      ref_height += window.innerHeight -50;
//console.log('favicon_check');
      var flag = false;
      var time;
      while (favicon_obj.length!=0 && favicon_obj[0].pn.offsetTop<ref_height) {
        favicon_obj[0].pn.removeEventListener('mouseover', favicon_check, false);
        time = favicon_obj[0].time;
        flag=true;
        if (favicon_obj[0].marked) {
          favicon_obj[0].pn.setAttribute('style','border:none');
          delete favicon_obj[0].marked;
        }
//console.log(favicon_obj[0]);
        if (this===favicon_obj.shift().pn) break;
      }
      if (flag) {
//        threads[name][19][2] = threads[name][8][2] - favicon_obj.length;
        threads[name][19][2] = favicon_obj.length;
        threads[name][19][1] = 0;
        for (var i=0;i<favicon_obj.length;i++) if (favicon_obj[i].reply_to_me) threads[name][19][1]++;
        notifier.favicon.set(threads);
        if (pref.thread_reader.sync && window.opener) send_message('parent',[['TRIAGE',[name,'WATCH','',false,time]]]);
      }
    }
    function mark_newer_posts(time){
      var retval = null;
      var i=0;
      while (i<favicon_obj.length && favicon_obj[i].time < time) i++;
      if (i<favicon_obj.length) retval = favicon_obj[i].pn;
      while (i<favicon_obj.length) {
        favicon_obj[i].marked = true;
//        favicon_obj[i].pn.setAttribute('style','background:yellow');
        favicon_obj[i].pn.setAttribute('style','border:2px solid red');
        i++;
      }
      ignore_scroll = true;
      return retval; // scroll will be done.
    }

    var triage;
    var buttons = document.createElement('div');
    buttons.innerHTML = '<button name="thread_reader.buttons.B">B</button>'+
                        '<button name="thread_reader.buttons.UB">UB</button>'+
                        ((window.opener)? '<button name="thread_reader.buttons.X">X</button>'+
                                          '<button name="thread_reader.buttons.v">v</button>'
                                        : '');
    var buttons_collection = buttons.getElementsByTagName('*');
    buttons_collection['thread_reader.buttons.B'].onclick  = function(){common_func.modify_bookmark(name,true)};
    buttons_collection['thread_reader.buttons.UB'].onclick = function(){common_func.modify_bookmark(name,false)};
    if (window.opener) {
      buttons_collection['thread_reader.buttons.X'].onclick = function(){triage_exe('KILL','');};
      buttons_collection['thread_reader.buttons.v'].onclick = function(){triage_exe('TIME','');};
    }
//    var th_link = document.getElementById('thread-links');
//    th_link.parentNode.insertBefore(buttons,th_link);
    var pn_ref = site.embed_to['bottom'];
    pn_ref.parentNode.insertBefore(buttons,pn_ref);
    if (window.opener && pref.thread_reader.triage) {
//      var triage_all = common_func.make_triage({onclick:triage_event, wheelpatch:false});
//      triage_str = triage_all.str;
//      th_link.parentNode.insertBefore(triage_all.pn,th_link);
      triage = new common_func.Triage(pref.catalog_triage_str,{onclick:triage_event, wheelpatch:false, name:'thread_reader_triage'});
      pn_ref.parentNode.insertBefore(triage.pn,pn_ref);
    }
    if (pref.tooltip.show) {
      pref_func.tooltips.add_hier(buttons);
//      pref_func.tooltips.add_hier(triage.pn);
    }

    function triage_event(){
      var flds = this.name.split(',');
      var i = parseInt(flds[0].replace(/[^\(]*\(/,''),10);
      var j = parseInt(flds[1].replace(/\).*/,''),10);
//      var i = parseInt(flds[0],10);
//      var j = parseInt(flds[1],10);
      triage_exe(triage.str[i][j],triage.str[i][j+2]);
    }
    function triage_exe(com0,com1){
      send_message('parent',[['TRIAGE',[name,com0,com1,true, threads[name][19][3]]]]);
      if (pref.thread_reader.triage_close) window.close();
    }

//    window.addEventListener('storage', site2[site.nickname].prep_own_posts_event, false); // can't catch events from this thread.
    if (pref.notify.favicon) window.addEventListener('scroll', favicon_check, false);
//    base_thread.addEventListener('DOMSubtreeModified',updated_buf,false);
//    base_thread.addEventListener('DOMNodeInserted',updated_buf,false);
    var observer = new MutationObserver(updated_buf);
    observer.observe(myself_th.pn, {childList: true});

//    threads[name][19][3] = --threads[name][19][0];threads[name][19][0]--;updated(); // debug
    if (site.postform_submit) add_event_to_submit(site.postform_submit);
////////    window.addEventListener('storage', remake_own_posts_flag, false);
    window.addEventListener('storage', site2[site.nickname].check_reply.remake_own_posts, false);

    return {
      mark_newer_posts: mark_newer_posts,
      destroy : function(){ // destroy
//        base_thread.removeEventListener('DOMSubtreeModified',updated_buf,false);
//        base_thread.removeEventListener('DOMNodeInserted',updated_buf,false);
        observer.disconnect();
////////        window.removeEventListener('storage', remake_own_posts_flag, false);
        window.removeEventListener('storage', site2[site.nickname].check_reply.remake_own_posts, false);
        if (site.postform_submit)  remove_event_from_submit(site.postform_submit);
        if (site.postform_submit2) remove_event_from_submit(site.postform_submit2);
        return null;
      },
      add_event_to_submit : add_event_to_submit,
      remove_event_from_submit : remove_event_from_submit
    }
  }
//  thread_reader_init();
  function thread_reader_init(){
    if (common_obj.thread_reader===null && site.features.thread_reader && pref.features.thread_reader && site.whereami==='thread' && pref.thread_reader.use) common_obj.thread_reader = make_thread_reader();
    else if (!pref.thread_reader.use && common_obj.thread_reader) common_obj.thread_reader = common_obj.thread_reader.destroy();
  }



  var liveTag = {
    pn : null,
    pn_board : null,
    pn_filter_rexp : null,
    active: {pk:0, in:0, ex:0},
    tags_ci: null, // refers tags.__proto__
    tags : Object.create(Object.create(null)),
                                // tags[TAG] = {key:, num;, mems:, cbx:{pk:, in:, ex:}, (tgts:,) pn:, pn_num:, // summary tree
                                //              ur:};
//  mems : Object.create(null), // member tree : mems[domain][boards][no] = [[[],{},' '], [[],{}], threads_name_19];
                                //   [0]:fixed, [1]:bumped, [x][0]:tags, [x][1]:keys, [0][2]:string,
                                //   [2]:threads[name][19]
                                //     [0]:time_of_checked, [1]:num_of_unread_replies_TO_ME, [2]:num_of_unread_replies,
                                //     [3]:time_of_checked_time_internal, [4]:args_for_desktop_notification, [5]:init,
                                //     [6]:time_of_checked_old, [7]:num_of_checked_posts, [8]:inital_loop,
                                //     [9]:tag_temp, [10]:num_of_posts
    mems : Object.create(null, {  //  CAUTION. USED ALWAYS EVEN IF pref.liveTag.use===false
      getFromName: {value: function(name) {
        var dbt = common_func.fullname2dbt(name);
        return (dbt[2])? this[dbt[0]][dbt[1]][dbt[2]] : this[dbt[0]][dbt[1]];}},
      init: {value: function(th) {
////        if (this[th.domain]===undefined) this[th.domain] = Object.create(null, {proto:{value:Object.create(this.acc, {domain:{value:th.domain}})}, // working code.
////                                                                                pfunc:{value:Object.create(null)}});
////        if (!th.board) return this[th.domain];
////
////        if (this[th.domain][th.board]===undefined) {
////          this[th.domain][th.board] = Object.create(this[th.domain].proto,
////                                                     {proto:{value:Object.create(this[th.domain].proto,
////                                                                                  {board:{value:th.board},
////                                                                                   btag:{value:'#'+th.board.substr(1,th.board.length-2)}})},
////                                                      nr:{value:0, writable:true}, nrtm:{value:0, writable:true}, nr_dirty:{value:false, writable:true},
////                                                      u:{value:0, writable:true}, board:{value:th.board}, read_time:{value:0, writable:true},
////                                                     });

        if (this[th.domain]===undefined) this[th.domain] = Object.create(Object.create(this.acc, {domain:{value:th.domain}}), {pfunc:{value:Object.create(null)}});
        if (!th.board) return this[th.domain];

        if (this[th.domain][th.board]===undefined) {
          this[th.domain][th.board] = Object.create(Object.create(Object.getPrototypeOf(this[th.domain]),
                                                                  {board:{value:th.board},
                                                                   btag:{value:'#'+th.board.substr(1,th.board.length-2)}}),
                                                    {nr:{value:0, writable:true}, nrtm:{value:0, writable:true}, nr_dirty:{value:false, writable:true},
                                                     u:{value:0, writable:true}, read_time:{value:0, writable:true},
                                                    });
          var btag = this[th.domain][th.board].btag; // must be read after making btag to force to use the same reference.
          liveTag.update_tags_in_th_sub([], {}, [btag], {}, 1, th, 0, null);
          liveTag.tags[btag].ref_tag = btag; // set btag reference.
//          if (pref.liveTag.inherit_board_name) liveTag.tags[btag].mems[th.domain+th.board] = btag;
          if (pref.liveTag.inherit_board_name) liveTag.tags[btag].mems.set(this[th.domain][th.board],btag);
        }
        if (!th.no) return this[th.domain][th.board];

        if (this[th.domain][th.board][th.no]===undefined) {
//          this[th.domain][th.board][th.no] = {1:undefined, 2:[0,0,0,0,null,true,-2, 0, true, [], 1],  // init [10] as 1.// working code.
//                                              u:0, no:th.no,
//                                              __proto__:Object.getPrototypeOf(this[th.domain][th.board])};
          this[th.domain][th.board][th.no] = Object.create(Object.getPrototypeOf(this[th.domain][th.board]),{
                                               '1':{value:undefined, writable:true},
                                               '2':{value:Object.create(this.watch,{ // 4,5,7,9 are shared for reducing memory consumption.
                                                 '0':{value:0, writable:true},
                                                 '1':{value:0, writable:true},
                                                 '2':{value:0, writable:true},
                                                 '3':{value:0, writable:true},
//                                                 '6':{value:-2, writable:true},
//                                                 '8':{value:true, writable:true},
                                                 '10':{value:-1, writable:true}
                                               })},
                                               u:{value:0, writable:true}, // require 32Bytes/instance, 2.5% memory increase/instance.
                                               no:{value:th.no, writable:true},
                                             });
          var btag = this[th.domain][th.board][th.no].btag;
          liveTag.key_dirty[(pref.liveTag.ci)? btag.toLowerCase() : btag] = null;
          var btag2 = this[th.domain][th.board][th.no].btag2;
          if (btag2) for (var i=0;i<btag2.length;i++) liveTag.key_dirty[(pref.liveTag.ci)? btag2[i].toLowerCase() : btag2[i]] = null;
        }
        return this[th.domain][th.board][th.no];}},
      watch: {value: Object.create(null, {  //'1':{value:undefined, writable:true, configurable:true}, // default value of 1.
                                          '4':{value:null, writable:true},
                                          '5':{value:true, writable:true},
                                          '7':{value:0, writable:true},
                                          '9':{value:[], writable:true},
                                         })},
      acc: {value: Object.create(null, {  // to reduce memory consumption.
        0: {
////          get: function() {return (pref.liveTag.inherit_board_name && pref.liveTag.lock_board_name)? [this.btag] : null;}, // working code.
////          set: function(val) {if (!pref.liveTag.inherit_board_name || !pref.liveTag.lock_board_name || val.length>=2) // inherit and lock ensures val.length>=1
////                 Object.defineProperty(this,'0',{value:val, enumerable:true, configurable:true, writable:true}); // works.
//////                 this.mems[this.domain][this.board][this.no]  = [val, this[1], this[2]];
////               },
////        },
          get: function() {
            var tag = this.btags;
            if (this.tl) tag = (tag)? tag.concat(this.tl) : this.tl;
            return tag;
          },
          set: function(val) {
            var ref = this.btags;
            if (ref) {
              if (pref.liveTag.ci) for (var i=0;i<ref.length;i++) ref[i] = ref[i].toLowerCase();
              for (var i=0;i<val.length;i++) if (ref.indexOf((pref.liveTag.ci)? val[i].toLowerCase() : val[i])!=-1) val.splice(i--,1);
            }
            if (val.length>0) this.tl = val;
            else if (this.tl!==undefined) delete this.tl;
          },
        },
        t: {get: function(){return this[1];}}, // TEMPORAL
        key: {get: function(){return this.domain + this.board + ((this.no)? this.no : '');}},
        tag: {get: function(){return (this[0] || []).concat(this[1] || []);}},
//        tag: {get: function(){
//          var tag0 = this[0];
//          var tag1 = this[1];
//          return (tag0 && tag1)? tag0.concat(tag1) : (tag0)? tag0 : (tag1)? tag1 : null;
//        }},
        btags: {get: function(){
          var tag = (pref.liveTag.inherit_board_name && pref.liveTag.lock_board_name)? [this.btag] : null;
          if (pref.liveTag.inherit_board_tags && pref.liveTag.lock_board_tags && this.btag2) tag = (tag)? tag.concat(this.btag2) : this.btag2;
          return tag;}},
      })}
    }),
//    mems_obj_accessors: { // to reduce memory consumption.
//      get 0() {return (this._btag)? ((this._0)? [this.btag].concat(this._0) : [this.btag]) : this._0;}, // _0 is null at initial, and will never back to null after once promoted to [].
//      set 0(val) {if (val[0]===this.btag) {
//                     this._btag = true;
//                     val.shift();
//                   } else this._btag = false;
//                   this._0 = (val.length!=0)? val : null;
//                 }
//    },
    ex_list_changed: function(){
      if (pref.liveTag.ex_list) {
        for (var d in this.mems) for (var b in this.mems[d]) for (var t in this.mems[d][b]) {
          var tag = this.mems[d][b][t];
          if (this.exclude_tags(d+b+t, tag, true)) {
            liveTag.list_nup.add(d+b+t);
//            tag[2][9] = 'retag';
//            common_func.set_value_to_root(tag[2],'9','retag');
            if (tag[2][3]>0) tag[2][3] = -tag[2][3]; // retag
          }
////          if (liveTag.list_nup[th.key]===undefined) {
////            var ex_list = pref_func.merge_obj5(d+b+t,pref.liveTag.ex_list_obj5,null);
////            if (ex_list) {
////              var flag = false;
////              var tag = this.mems[d][b][t];
////              for (var k=0;k<ex_list.length;k++) { // CAUTION. LIMIT CHANGABLE TAG OR ISSUE REDUNDANT ACCESS.
////                for (var j=0;j<2;j++) {
////                  if (tag[j]) for (var i=0;i<tag[j].length;i++) if (ex_list[k].test(tag[j][i])) {
////                    this.delete_tags(tag[j][i],d+b+t);
////                    tag[j].splice(i--,1);
////                    flag = true;
////                  }
////                }
////              }
////              if (flag) {
////                liveTag.list_nup[d+b+t]=3;
////                tag[2][9] = 'retag';
////              }
////            }
////          }
        }
        cataLog.catalog_liveTag_scan_threads();
        this.update_pn_buf.delayed_do();
      }
    },
    exclude_tags: function(key, tag, remove){
      var ex_list = pref_func.merge_obj5(key,pref.liveTag.ex_list_obj5,null);
      if (ex_list) {
        var flag = false;
        for (var k=0;k<ex_list.length;k++) { // CAUTION. LIMIT CHANGABLE TAG OR ISSUE REDUNDANT ACCESS.
          for (var j=0;j<2;j++) {
            if (tag[j]) for (var i=0;i<tag[j].length;i++) if (ex_list[k].test(tag[j][i])) {
              if (remove) this.delete_tags(tag[j][i],key);
              tag[j].splice(i--,1);
              flag = true;
            }
          }
        }
      }
      return flag;
    },
    key_dirty: Object.create(null),
////    tags_mems: Object.create(null, { // working code.
////      keys_obj: {get: function(){ // working code.
////        var keys = Object.create(null);
////        for (var i in this) {
////////////if (!pref.test_mode['23']) { // test_mode['23'] is meaningless, because String is handled by reference.
////////////          var val = this[i];
////////////} else {
////////////          var val = this.search_from_dic(this[i]);
////////////}
////          if (i[i.length-1]==='/') {
////            var dbt = common_func.fullname2dbt(i);
////            for (var j in liveTag.mems[dbt[0]][dbt[1]]) keys[i+j] = this[i];
////          } else keys[i] = this[i];
////        }
////        return keys;
////      }},
////      keys_length: {get: function(){
////        var len = 0;
////        for (var i in this) {
////          if (i[i.length-1]==='/') {
////            var dbt = common_func.fullname2dbt(i);
////            len += Object.keys(liveTag.mems[dbt[0]][dbt[1]]).length;
////          } else len++;
////        }
////        return len;
////      }},
////////////      search_from_dic: {value: function(no){for (var i in this.dic) if (this.dic[i]==no) return i;}},
////////////      clean_up_dic: {value: function(){
////////////        var keys = {};
////////////        for (var i in this) keys[this[i]] = null;
////////////        for (var i in this.dic) if (keys[this.dic[i]]!==null) delete this.dic[i];
////////////      }},
////    }),
    tags_array_old : [],
    tags_boardlist: [],
    tags_proto: {pk:false, in:false, ex:false,
      mems_keys_obj: function(){ // working code.
        var keys = {};
        for (var i of this.mems.keys())
          if (i.no===undefined) for (var j in i) keys[i[j].key] = this.mems.get(i);
          else keys[i.key] = this.mems.get(i);
        return keys;
      },
      mems_keys: function*(){ // iterator is slow in chome because iterator is not optimized.
        for (var i of this.mems.keys())
          if (i.no===undefined) for (var j in i) yield i[j];
          else yield i;
      },
      mems_keys_length: function(){
        var len = 0;
        for (var i of this.mems.keys())
//          if (i.no===undefined) len += Object.keys(i).length; // slow???
          if (i.no===undefined) for (var j in i) ++len;
          else ++len;
        return len;
      },
      mems_keys_length_and_set_top: function(){
        var len = 0;
        var keys = {};
        for (var i of this.mems.keys()) {
          var key = this.mems.get(i);
          if (keys[key]===undefined) keys[key] = 0;
          if (i.no===undefined) for (var j in i) {++keys[key];++len;}
          else {++keys[key];++len;}
        }
        for (var j in keys) if (keys[j]>keys[this.key] || (keys[j]==keys[this.key] && j<this.key)) this.key = j;
        return len;
      },
    },
////    list_nup_boards : Object.create(null), // list of next updates of boards.
////    list_nup : Object.create(null), // list of next updates.
    list_nup : {
      // th.u: 0:ready, >0:requested, <0:blacklisted
      add: function(th){
        if (typeof(th)==='string') th = this.get_th(th);
        if (th.u===0) th.u = 3;
      },
      issued: function(th){
        if (typeof(th)==='string') th = this.get_th(th);
        if (th) th.u = (th.u===1)? -1 : (th.u===0)? 2 : th.u-1;
      },
      got_200: function(th){
        if (typeof(th)==='string') th = this.get_th(th);
        if (th.u!==0) th.u = 0; // not create instances for future implementation.
      },
      got_404: function(th){
        if (typeof(th)==='string') th = this.get_th(th);
        if (th) th.u = -1;
      },
      get_th: function(key){
        var dbt = common_func.fullname2dbt(key);
        if (dbt[2].search(/(p|q)[0-9]+$/)!=-1) return null; // prevent board to be blacklisted when over page loading.
        if (dbt[2].search(/^[0-9]/)==-1) dbt[2] = '';
        return liveTag.mems.init({domain:dbt[0], board:dbt[1], no:dbt[2]});
      },
      get_list_thread: function(){
        var list = [];
        for (var d in liveTag.mems)
          for (var b in liveTag.mems[d])
            for (var t in liveTag.mems[d][b])
              if (liveTag.mems[d][b][t].u>0) list[list.length] = liveTag.mems[d][b][t];
        return list;
      },
      add_board: function(bd, time){
        if (typeof(bd)==='string') bd = this.get_th(bd);
//        if (bd.u===0) bd.u = 3;
        bd.u = 3;
        if (bd.max) bd.read_max = bd.max;
        bd.read_time = time;
      },
      get_list_board: function(query_members){
        var list = [];
        var time_th = Date.now()-pref.liveTag.pickup_interval*1000;
        for (var d in liveTag.mems)
          for (var b in liveTag.mems[d]) {
            var tgt = liveTag.mems[d][b];
            if (tgt.u>0) if (query_members || (tgt.read_time<time_th && (tgt.max===undefined || tgt.read_max<tgt.max))) list[list.length] = tgt;
          }
        return list;
      },
    },
////    list_nup : {
////      list_req: [], // to reduce memory consumption
////      list_req_old: [],
////      list_exam: {},
////      list_black: {},
////      add: function(key){
////        if (this.list_black[key]===undefined) {
////          var dbt = common_func.fullname2dbt(key);
////          this.list_req[this.list_req.length] = this.mems[dbt[0]][dbt[1]][dbt[2]]; // to reduce memory consumption
////        }
////      },
////      get_list: function(){
////        for (var i=0;i<this.list_req_old.length;i++)
////          if (this.list_req_old[i]===null) { // undefined if the therad was pruned.
////            var key = this.list_req_old[i].key;
////            this.list_exam[key] = (this.list_req_exam[key] || 3) -1;
////            if (this.list_req_exam[key]==0) {
////              this.list_black[key] = null;
////              delete this.list_req_exam[key];
////            }
////          }
////        }
////        this.list_req_old = this.list_req;
////        this.list_req = [];
////        return this.list_req_old;
////      },
////      query: function(key){
////        for (var i=0;i<this.list_req.length;i++) if (this.list_req[i].key===key) return true;
////        for (var i=0;i<this.list_req_old.length;i++) if (this.list_req_old[i].key===key) return true;
////        return false;
////      }
////    },
    scan_regex : /#[^#, \.:;\n\|"<>]+(?=[#, \.:;\n\|"<>]|$)/g, // ATTENTION. REFER function prep_tag_str();
////    update_tags_in_th_sub: function(tags, keys, src, keys_fix, num, th, ur, btag){ // working code for obj.
////      var count = tags.length;
////      var i = 0;
////      while (count<num && i<src.length) {
////        var k = src[i++];
////        var k_ci = (pref.liveTag.ci)? k.toLowerCase() : k;
////        if (k_ci===k) k_ci=k; // to reduce memory consumption.
////        if (keys_fix[k_ci]===undefined) {
////          if (keys[k_ci]===undefined) {
////            keys[k_ci] = k; // discarded every time, so needless to think about reference of 'k'.
//////            tags[count++] = k;
////            if (this.tags[k]===undefined) {
////              if (this.tags_ci[k_ci]===undefined) {
////////////if (!pref.test_mode['23']) {
////                this.tags_ci[k_ci] = {key:k, mems:Object.create(this.tags_mems), ref_tag:k,
//////                                    pk:false, in:false, ex:false, // moved to prototype
////                                      pn:null, pn_num:0, ur:ur, __proto__:this.tags_proto};
////////////} else {
////////////                this.tags[k] = {key:k, mems:Object.create(this.tags_mems, {dic:{value:{}, writable:true}, dic_no:{value:0, writable:true}}),
////////////                                cbx:{pk:false, in:false, ex:false}, pn:null, pn_num:0, ur:ur};
////////////}
////                if (this.tags[k]===undefined) this.tags[k] = this.tags_ci[k_ci];
////              } else this.tags[k] = this.tags_ci[k_ci];
//////              this.tags[k].tgts[k] = null;
////            }
////////            this.tags[k].mems[name] = k;
////            var mems = this.tags[k].mems;
////////////if (!pref.test_mode['23']) {
////////////            var val = k;
////////////} else {
////////////            if (mems.dic[k]===undefined) {mems.dic[k]=mems.dic_no++;} // to reduce memory consumption, use dictionary.
////////////            var val = mems.dic[k];
////////////}
////            if (k===this.tags[k].ref_tag) k = this.tags[k].ref_tag; // get the same reference to reduce memory consumption. This makes major of members see 'btag'.
////            else for (var j in mems) if (k===mems[j]) {k=mems[j]; break;}
////            if (k!==btag) {
////              if (mems[th.key]!==k) this.key_dirty[k_ci] = null; // cases are changed or a new tag is added. 'if (keys[k_ci]!==k)' ensures (pref.liveTag.ci===true).
////              mems[th.key] = k; // write always to force to use the same reference to reduce memory.
////            }
////            tags[count++] = k;
////          }  // else if (keys[k_ci]!==k) this.tags[this.tags_ci[k_ci]].key_dirty = true; // case is changed. 'if (keys[k_ci]!==k)' ensures (pref.liveTag.ci===true).
////        }
////      }
////      return i;
////    },
    update_tags_in_th_sub: function(tags, keys, src, keys_fix, num, th, ur, bd){
      var count = tags.length;
      var i = 0;
      while (count<num && i<src.length) {
        var k = src[i++];
        var k_ci = (pref.liveTag.ci)? k.toLowerCase() : k;
        if (k_ci===k) k_ci=k; // to reduce memory consumption.
        if (keys_fix[k_ci]===undefined) {
          if (keys[k_ci]===undefined) {
            keys[k_ci] = k; // discarded every time, so needless to think about reference of 'k'.
            if (this.tags[k]===undefined) {
              if (this.tags_ci[k_ci]===undefined) {
                this.tags_ci[k_ci] = {key:k, mems: new Map(), ref_tag:k,
                                      pn:null, pn_num:0, ur:ur, __proto__:this.tags_proto};
                if (this.tags[k]===undefined) this.tags[k] = this.tags_ci[k_ci];
                this.key_dirty[k_ci] = null; // for pickup in 'update_pn'
//                if (pref.debug_mode['3']) console.log('Added: '+k);
              } else this.tags[k] = this.tags_ci[k_ci];
            }
            var mems = this.tags[k].mems;
            if (k===this.tags[k].ref_tag) k = this.tags[k].ref_tag; // get the same reference to reduce memory consumption. This makes major of members see 'btag'.
            else for (var j in mems) if (k===mems.get(j)) {k=mems.get(j); break;}
//            if (k!==btag) {
            if (bd!==null && !mems.has(bd)) {
              var me = this.mems[th.domain][th.board][th.no];
              var val = mems.get(me);
              if (val===undefined || val!==k) this.key_dirty[k_ci] = null; // cases are changed or a new tag is added. 'if (keys[k_ci]!==k)' ensures (pref.liveTag.ci===true).
              mems.set(me,k); // write always to force to use the same reference to reduce memory.
            }
            tags[count++] = k;
          }
        }
      }
      return i;
    },
    update_tags_in_th: function(src_new, src_old, keys_fix, num, th, watch, bd){
      var ur = (watch[1]!=0)? 3 : (watch[2]!=0)? 1 : 0; // moved to here from 'extract_tags' because 'prep_tags' needs this when it has tags_old.
      var tags = [];
      var keys = {};
      this.update_tags_in_th_sub(tags, keys, src_new, keys_fix, num, th, ur, bd);
      if (src_old) {
        var i = this.update_tags_in_th_sub(tags, keys, src_old, keys_fix, num, th, ur, bd);
        while (i<src_old.length) {
          var k = src_old[i++];
          var k_ci = (pref.liveTag.ci)? k.toLowerCase() : k;
          if (keys_fix[k_ci]===undefined) {
            if (keys[k_ci]!==k) this.key_dirty[k_ci] = null; // case is changed, or removed. 'if ((k_ci in keys) && keys[k_ci]!==k)' ensures (pref.liveTag.ci===true).
            if (keys[k_ci]===undefined) this.delete_tags(k,th.key);
          }
        }
      }
      for (var i in keys_fix) this.check_update_tags_color(keys_fix[i],ur);
      for (var i=0;i<tags.length;i++) this.check_update_tags_color(tags[i],ur);
//      this.update_pn();
//      this.update_pn_buf.delayed_do();
//      return [tags, keys, false];
      src_new = null;
      this.keys_fix = keys;
      return tags;
    },
    remove_tags_in_th: function(dbt){
      var name = dbt[0]+dbt[1]+dbt[2];
      var tags = this.mems[dbt[0]][dbt[1]][dbt[2]];
      for (var j=0;j<2;j++) if (tags[j]) for (var i=tags[j].length-1;i>=0;i--) this.delete_tags(tags[j][i],name);
//      var btag = this.mems[dbt[0]][dbt[1]][dbt[2]].btag;
//      this.key_dirty[this.tags_ci[(pref.liveTag.ci)? btag.toLowerCase() : btag].key] = null;
      var btags = this.mems[dbt[0]][dbt[1]][dbt[2]].btags;
      if (btags) for (var i=0;i<btags.length;i++) this.key_dirty[(pref.liveTag.ci)? btags[i].toLowerCase() : btags[i]] = null;
      delete this.mems[dbt[0]][dbt[1]][dbt[2]];
      this.update_pn_buf.delayed_do();
//      if (pref.debug_mode['3']) console.log('remove: '+name);
//      if (pref.debug_mode['3']) {
////        var th_count = 0;
////        for (var d in this.mems) for (var b in this.mems[d]) for (var t in this.mems[d][b]) th_count++;
////        console.log('remove: '+name+', '+tags.tag+', tags_ci+tags: '+Object.keys(this.tags_ci).length+'+'+Object.keys(this.tags).length+', threads:'+th_count);
//        for (var i in this.tags_ci) for (var j of this.tags_ci[i].mems.keys()) if (j===tags) console.log('ERROR: tags_ci['+i+'].mems has a reference to a deleted thread.');
//      }
    },
    delete_tags: function(tag,name){
//      delete this.tags[tag].mems[name];
      this.key_dirty[(pref.liveTag.ci)? tag.toLowerCase() : tag] = null;
      if (this.tags[tag]) this.tags[tag].mems.delete(this.mems.getFromName(name));
      if (pref.liveTag.style) this.update_ur_1(tag);
//      if (Object.keys(this.tags[tag].mems).length==0) {
      if (this.tags[tag].mems.size==0) {
//        if (this.tags[tag].pn!==null) this.pn.removeChild(this.tags[tag].pn); // CAUSE ERROR, WHY???
        if (this.tags[tag].pn!==null) if (this.tags[tag].pn.parentNode===this.pn) this.pn.removeChild(this.tags[tag].pn);
//        delete this.tags[tag].tgts[tag];
        for (var i in this.active) if (this.tags[tag][i]) this.active[i]--;
        delete this.tags[tag];
//        if (pref.liveTag.ci) for (var i in this.tags) if (!this.tags[i]) delete this.tags[i]; // tags are not removed in 'update_tags_in_th_sub' if cases are changed.
        var tag_ci = (pref.liveTag.ci)? tag.toLowerCase() : tag;
        for (var i in this.tags) if (this.tags[i]===this.tags_ci[tag_ci]) delete this.tags[i];
        delete this.tags_ci[tag_ci];
        if (pref.debug_mode['3']) console.log('Remove: '+tag);
      }
    },
    check_update_tags_color: function(tag, ur){ // checks 0->1 only.
      var ur_old = this.tags[tag].ur;
      this.tags[tag].ur |= ur;
//      if (pref.debug_mode['4']) if (ur_old!=ur) console.log('ur: '+tag+', '+ur_old+' <- '+ur);
      if (~ur_old & ur) this.update_tag_node(tag);
    },
    rm_404: function(domain, board, nos){
      var rm_list = [];
      if (this.mems[domain] && this.mems[domain][board]) {
        var mems = this.mems[domain][board];
        var db = domain + board;
        for (var i in mems) if (!((db+i) in nos)) {
//          if (pref.debug_mode['3']) console.log('remove_req: '+i);
          this.remove_tags_in_th([domain,board,i]);
          rm_list[rm_list.length] = db+i;
        }
      }
      return rm_list;
    },
//    find_friend_tag_ci: function(tag){
//      var tag_l = tag.toLowerCase();
//      for (var i in liveTag.tags) if (tag!==i && tag_l===liveTag.tags[i].key.toLowerCase()) return i;
//      return null;
//    },
    tooltip: function(e){
      var str;
      if (this.type==='checkbox') {
        var suffix =  this.name.substr(-2,2);
        str = (suffix==='pk')? 'Pickup threads which have this tag.' :
              (suffix==='in')? 'Show threads which have this tag.' :
                               'Hide threads which have this tag.' ;
      } else {
        var tag = this.getAttribute('name');
        str = tag + ':<br>';
//        for (var i in liveTag.tags[tag].mems) str += i + ', ';
        var myDomain = new RegExp('^'+site.nickname);
        for (var i of liveTag.tags[tag].mems.keys()) str += i.key.replace(myDomain,'') + ', ';
      }
      pref_func.tooltips.show_1.call(this,e,str);
    },
    boardlist_click_entry: function(){
      liveTag.boardlist_click(this.textContent, this);
    },
    boardlist_click: function(tag, sender){
      this.tags[tag]['pk'] = !this.tags[tag]['pk'];
      this.tags[tag]['in'] =  this.tags[tag]['pk'];
      if (this.tags[tag].pn!==null) {
        this.tags[tag].pn.childNodes[0].checked = this.tags[tag]['pk'];
        this.tags[tag].pn.childNodes[1].checked = this.tags[tag]['in'];
      }
      this.cbx_onchange(tag,'pk');
      this.cbx_onchange(tag,'in');
//      if (this.tags[tag]['pk']) {
////        sender.style = pref.liveTag.style_in_obj4; // doesn't work.
//        common_func.init_set_style(sender,pref.liveTag.style_in_obj4);
////        sender.style = {};
////        sender.style.color = 'red';
//      } else sender.style.color = '';
      this.update_tag_node(tag, sender);
    },
    update_ur: function(name,ur,all_case){
      var dbt = common_func.fullname2dbt(name);
      var tag = this.mems[dbt[0]][dbt[1]][dbt[2]];
      this.mems[dbt[0]][dbt[1]].nr_dirty = true;
//      var tag = this.mems.getFromName(name);
      for (var j=0;j<2;j++) if (tag[j]) for (var i=0;i<tag[j].length;i++) 
        if (!all_case) {if (this.tags[tag[j][i]]) this.check_update_tags_color(tag[j][i],ur);}
        else this.update_ur_1(tag[j][i]);
    },
    update_ur_1: function(tag){ // subfunc of 'count_ur'
      var ur_old = this.tags[tag].ur;
      var ur = 0;
if (!pref.test_mode['24']) {
      var mems_objs = this.tags[tag].mems_keys_obj(); // working code.
      for (var i in mems_objs) {
//        var info = this.mems.getFromName(i)[2];
        var info = this.mems.getFromName(i);
        if (info) {
          info = info[2];
          ur |= (info[1]!=0)? 3 : (info[2]!=0)? 1 : 0;
        }
      }
} else {
      for (var i of this.tags[tag].mems_keys()) {
        var info = i[2];
        ur |= (info[1]!=0)? 3 : (info[2]!=0)? 1 : 0;
      }
}
      if (ur_old!=ur) {
        this.tags[tag].ur = ur;
        this.update_tag_node(tag);
      }
    },
//    count_ur: function(tag){
//      var nums = this.count_ur_sub(tag);
//      var friends = Object.create(null);
//      friends[tag] = null;
//      if (pref.liveTag.ci) {
//        var tag_l = tag.toLowerCase();
//        for (var i in liveTag.tags) {
//          if (tag!==i && tag_l===liveTag.tags[i].key.toLowerCase()) {
//            friends[i]=null;
//            if (this.tags[i].ur_cs===null) this.count_ur_sub(i);
//            for (var j=0;j<4;j++) nums[j] += this.tags[i].ur_cs[j];
//          }
//        }
//      }
//      for (var i in friends) this.tags[i].ur = nums;
//      return nums;
//    },
//    count_ur_sub: function(tag){
    count_ur: function(tag){
      var nums = [0,0,0,0,0];
      var bds = {};
if (!pref.test_mode['24']) {
      var mems_objs = this.tags[tag].mems_keys_obj(); // working code.
      for (var i in mems_objs) {
        var dbt = common_func.fullname2dbt(i);
        var info = this.mems[dbt[0]][dbt[1]][dbt[2]][2];
        nums[0] += info[1];
        nums[1] += info[2];
        if (info[2]!=0) nums[2]++;
        bds[dbt[0]+dbt[1]] = null;
      }
      nums[3] = this.tags[tag].mems_keys_length();
} else {
      for (var i of this.tags[tag].mems_keys()) {
        var info = i[2];
        nums[0] += info[1];
        nums[1] += info[2];
        if (info[2]!=0) nums[2]++;
        bds[i.domain+i.board] = null;
        nums[3]++;
      }
}
      nums[4] = Object.keys(bds).length;
//      this.tags[tag].ur = (nums[0]!=0)? 3 : (nums[1]!=0)? 1 : 0;
      return nums;
    },
    tag_onmouseover: function(e){
      if (pref.liveTag.show_info_onmouseover) {
        var nums = liveTag.count_ur(this.textContent); // must exec every time because every update are NOT exact.
        var str = 'U: '+nums[0]+'/'+nums[1]+'/'+nums[2]+' / T: '+nums[3]+' / B: '+nums[4];
        pref_func.tooltips.show_1.call(this,e,str);
      }
    },
//    tag_in_thread_onclick_entry : function(e){liveTag.tag_in_thread_onclick(this, e);},
    tag_in_thread_onclick : function(tag){
//      var tag = sender.textContent;
      var in_old = this.tags[tag]['in'];
      if (pref.liveTag.click_func==='in' || (pref.liveTag.click_func==='inex' && !(this.tags[tag]['in']===false && this.tags[tag]['ex']===true))) {
        this.tags[tag]['in'] = !this.tags[tag]['in'];
        if (this.tags[tag].pn!==null) this.tags[tag].pn.childNodes[1].checked = this.tags[tag]['in'];
        this.cbx_onchange(tag,'in');
      }
      if (pref.liveTag.click_func==='ex' || (pref.liveTag.click_func==='inex' && !(in_old===false && this.tags[tag]['ex']===false))) {
        this.tags[tag]['ex'] = !this.tags[tag]['ex'];
        if (this.tags[tag].pn!==null) this.tags[tag].pn.childNodes[2].checked = this.tags[tag]['ex'];
        this.cbx_onchange(tag,'ex');
      }
    },
//    filter_onchange_entry : function(e){liveTag.filter_onchange(this, e);},
    filter_onchange : function(sender, e){
      this.pn_filter_rexp = (pref.catalog.filter.tag_filter_str==='')? null : new RegExp(pref.catalog.filter.tag_filter_str, (pref.liveTag.ci)? 'i': undefined);
////      for (var i in this.tags) // working code.
////        if (this.tags[i].pn!==null) this.tags[i].pn.style.display = (this.pn_filter_rexp===null || this.pn_filter_rexp.test(i))? '' : 'none';
      this.update_pn(true);
    },
    sort_func: function(a,b){return (a.num!=b.num)? b.num - a.num : (b.key > a.key)? -1:1;},
    update_pn_buf: null,
    update_pn : function(from_filter){
      if (this.pn===0) return; // trap for thread_reader.
      if (this.pn===null) {
        this.pn = document.getElementsByName('catalog.filter.tag_list')[0];
        if (this.pn) {
          this.pn.style.height = '16px';
          this.pn.style.width = '150px';
//          this.pn_board = document.getElementsByName('catalog.filter.tag_board_list')[0];
//          this.pn_board.style.height = '16px';
//          this.pn_board.style.width = '150px';
          this.filter_onchange();
        } else {
          this.pn = 0;
          return;
        }
      }

////      var tags_array = []; // working code.
//////      var keys = {};
//////      for (var i in this.tags) // patch, this can be removed if this.tags is fully overlayed at pref.liveTag.ci. // PATCHES CAN BE REMOVED
//////        if (keys[i]!==null) {
//////          keys[i] = null;
//////          tags_array[tags_array.length] = {key:i, num:Object.keys(this.tags[i].mems).length};
//////        }
//////      if (pref.liveTag.ci) {
//////        for (var i=0;i<tags_array.length;i++) { // search major key
//////          keys = {};
//////          var mems = this.tags[tags_array[i].key].mems;
//////          for (var j in mems) keys[mems[j]] = (keys[mems[j]] || 0) +1;
//////          for (var j in keys) if (keys[j]>keys[tags_array[i].key]) tags_array[i].key = j;
//////        }
//////      }
////
////      if (pref.liveTag.ci) {
////        for (var i in this.key_dirty) { // set major key
////          var tag_obj = this.tags_ci[(pref.liveTag.ci)? i.toLowerCase() : i];
////          if (tag_obj) {
////            var keys = {};
////            var mems = tag_obj.mems;
////            for (var j in mems) keys[mems[j]] = (keys[mems[j]] || 0) +1;
////            var key_old = tag_obj.key;
////////////if (!pref.test_mode['23']) {
////            for (var j in keys) if (keys[j]>keys[tag_obj.key]) tag_obj.key = j;
////////////} else {
////////////            for (var j in keys) if (keys[j]>keys[tag_obj.key]) tag_obj.key = tag_obj.mems.search_from_dic(j);
////////////            mems.clean_up_dic();
////////////}
////            if (key_old!==tag_obj.key) if (tag_obj.pn) tag_obj.pn.childNodes[3].textContent = Object.keys(tag_obj.mems).length + ': ' + tag_obj.key;
////          }
////        }
////      }
////      this.key_dirty = Object.create(null);
////      for (var i in this.tags_ci) tags_array[tags_array.length] = {key:this.tags_ci[i].key, num:this.tags_ci[i].mems_keys_length(),
////                                                                   disp: (this.pn_filter_rexp===null || !this.pn_filter_rexp.test(this.tags_ci[i].key))? 0 : 1};
////      tags_array.sort(this.sort_func);

      var tags_array = this.tags_array_old;
      for (i=0;i<tags_array.length;i++) {
        var key = tags_array[i].key;
        var k_ci = (pref.liveTag.ci)? key.toLowerCase() : key;
        if (this.key_dirty[k_ci]===null) {
          delete this.key_dirty[k_ci];
          if (this.tags_ci[k_ci]) {
            tags_array[i].num = (pref.liveTag.ci)? this.tags_ci[k_ci].mems_keys_length_and_set_top() : this.tags_ci[k_ci].mems_keys_length();
            if (key!==this.tags_ci[k_ci].key) {
              if (this.tags_ci[k_ci].pn) this.tags_ci[k_ci].pn.childNodes[3].textContent = tags_array[i].num + ': ' + this.tags_ci[k_ci].key;
              tags_array[i].key = this.tags_ci[k_ci].key;
            }
          } else {
            tags_array.splice(i--,1);
            continue;
          }
        }
        if (from_filter) tags_array[i].disp = (this.pn_filter_rexp===null || !this.pn_filter_rexp.test(tags_array[i].key))? 0 : 1;
      }
      for (var i in this.key_dirty)
        if (this.tags_ci[i]) {
          var tags_ary_num = (pref.liveTag.ci)? this.tags_ci[i].mems_keys_length_and_set_top() : this.tags_ci[i].mems_keys_length(); // sets key
          tags_array[tags_array.length] = {key:this.tags_ci[i].key, num:tags_ary_num,
                                           disp: (this.pn_filter_rexp===null || !this.pn_filter_rexp.test(this.tags_ci[i].key))? 0 : 1};
        }

      tags_array.sort(this.sort_func);
      this.key_dirty = Object.create(null);

////      for (var i in this.tags) tags_array[tags_array.length] = {key:i, num:Object.keys(this.tags[i].mems).length, mems:{}}; // working code.
//////      for (var i in this.tags) { // working code, moved to 'delete_tags'.
//////        var num = Object.keys(this.tags[i].mems).length;
//////        if (num==0){
//////          if (this.tags[i].pn!==null) this.pn.removeChild(this.tags[i].pn);
//////          delete this.tags[i];
//////          if (pref.debug_mode['3']) console.log('Remove: '+i);
//////        } else tags_array[tags_array.length] = {key:i, num:num, mems:{}};
//////      }
////
////      tags_array.sort(this.sort_func);
////
////      if (pref.liveTag.ci) {
////        var tags_ci = Object.create(null);
////        for (var i=0;i<tags_array.length;i++) {
////          var key = tags_array[i].key.toLowerCase();
////          if (!(key in tags_ci)) tags_ci[key] = i;
////          else {
////            var src = this.tags[tags_array[i].key];
////            var ref = this.tags[tags_array[tags_ci[key]].key];
////            var dst = tags_array[tags_ci[key]];
////            for (var j in src.mems) if (!(j in ref.mems)) dst.mems[j] = null;
////            dst.num = Object.keys(ref.mems).length + Object.keys(dst.mems).length;
////            tags_array[i].num = 0;
//////            src.pk = ref.pk;
//////            src.in = ref.in;
//////            src.ex = ref.ex;
//////            ref.ci[tags_array[i].key] = null;
////////            src.ci = {};
////            if (src.pn!==null) { // force to remake to reflect changes next time.
////              if (src.pn!==null) this.pn.removeChild(src.pn);
////              src.pn=null;
////              src.pn_num=0;
////            }
////          }
////        }
////        tags_array.sort(this.sort_func);
////      }
//////      if (pref.debug_mode['3']) console.log(JSON.stringify(tags_array));

//      var j=0;
      var pos_insert=0;
      for (var i=0;i<tags_array.length;i++) {
        var key = tags_array[i].key;
        var num = tags_array[i].num;
        var num_old = this.tags[key].pn_num;
        if (num!==num_old || from_filter) {
          var str = num + ': ' + key;
          this.tags[key].pn_num = num;
          var pn = this.tags[key].pn;
          if (pn!==null) {
            if (tags_array[i].num===0 || tags_array[i].disp===0) {
              this.pn.removeChild(pn);
              this.tags[key].pn = null;
            } else {
              this.tags[key].pn.childNodes[3].textContent = str;
//              if (this.tags_array_old[j] && key===this.tags_array_old[j].key) j++;
//              else {
              if (this.pn.childNodes[pos_insert]!==pn) this.pn.insertBefore(pn, this.pn.childNodes[pos_insert] || null);
              pos_insert++;
//                this.pn.insertBefore(pn, this.pn.childNodes[pos_insert++] || null);
//                if (pref.debug_mode['3']) console.log('Insert: '+((num>num_old)?'promote: ':'demote: ')+key+', '+num_old+' -> '+num+', '+i+', '+j+', '+num_of_skip);
//                if (num<num_old) num_of_skip--;
//              }
            }
          } else if (tags_array[i].num!=0 && tags_array[i].disp==1) {
            pn = document.createElement('span');
            pn.innerHTML = '<input type="checkbox" name="' + key + '.pk" ' + ((this.tags[key]['pk'])? 'checked' : '') + '>' + 
                           '<input type="checkbox" name="' + key + '.in" ' + ((this.tags[key]['in'])? 'checked' : '') + '>' + 
                           '<input type="checkbox" name="' + key + '.ex" ' + ((this.tags[key]['ex'])? 'checked' : '') + '>' +
                           '<span name="' + key + '">' + str + '</span><br>';
            pn.childNodes[0].onchange = this.cbx_onchange_entry;
            pn.childNodes[1].onchange = this.cbx_onchange_entry;
            pn.childNodes[2].onchange = this.cbx_onchange_entry;
            pn.childNodes[0].onmouseover = this.tooltip;
            pn.childNodes[1].onmouseover = this.tooltip;
            pn.childNodes[2].onmouseover = this.tooltip;
            pn.childNodes[3].onmouseover = this.tooltip;
//            pn.style = {};
//            pn.style.display = (this.pn_filter_rexp===null || this.pn_filter_rexp.test(key))? '' : 'none';
            this.pn.insertBefore(pn, this.pn.childNodes[pos_insert++] || null);
            this.tags[key].pn = pn;
//            for (var j in this.tags[key].tgts) this.tags[j].pn = pn;  // PATCHES CAN BE REMOVED
          }
        } else if (tags_array[i].disp==1) pos_insert++;
////        } else { // tracking // working code.
////          while (j<this.tags_array_old.length && key!==this.tags_array_old[j].key) {
////            if (this.tags[this.tags_array_old[j].key] && this.tags[this.tags_array_old[j].key].pn_num==this.tags_array_old[j].num) num_of_skip++; // removed(to be 0) while waiting or not processed yet(demote)
//////            if (pref.debug_mode['3']) {
//////              var debug_str = this.tags_array_old[j].key+', '+this.tags_array_old[j].num+', '+num_of_skip;
//////              if (this.tags[this.tags_array_old[j].key]===undefined) console.log('Removed: '+debug_str);
//////              else if (this.tags[this.tags_array_old[j].key].pn_num==this.tags_array_old[j].num) console.log('Skip: '+debug_str);
//////            }
////            j++;
////          }
////          j++;
////        }
      }
      this.tags_array_old = tags_array;

//      if (pref.debug_mode['3']) { // CHECKER, working code.
//        var flag = true;
//        var dom = [];
//        for (var i=0;i<tags_array.length;i++) {
//          if (tags_array[i].num==0) break;
//          var tgt = this.pn.childNodes[i].childNodes[3].textContent;
//          var key = tgt.replace(/[^:]+: /,'');
//          dom[dom.length] = key;
//          if (tags_array[i].key!==key) {
//            var j=0;
//            while (j<tags_array.length && tags_array[j].key!==key) j++;
//            if (j==tags_array.length) j=-1;
//            var k=0;
//            while (k<this.tags_array_old.length && this.tags_array_old[k].key!==key) k++;
//            if (k==this.tags_array_old.length) k=-1;
//            console.log('ERROR: '+tgt+', should be '+j+', but '+i+', '+k+' in old');
//            flag = false;
//          }
//        }
//        if (!flag) {
//          console.log(tags_array);
//          console.log(dom);
//          console.log(this.tags_array_old);
//        }
//      }

//      this.pn.innerHTML = '';
//      for (var i=0;i<tags_array.length;i++) if (tags_array[i].num!=0) {
//        var item = document.createElement('span');
//        var key = tags_array[i].key;
//        var str  = tags_array[i].num + ': ' + key;
//        item.innerHTML = '<input type="checkbox" name="' + key + '.pk" ' + ((this.tags[key].pk)? 'checked' : '') + '>' +
//                         '<input type="checkbox" name="' + key + '.in" ' + ((this.tags[key].in)? 'checked' : '') + '>' +
//                         '<input type="checkbox" name="' + key + '.ex" ' + ((this.tags[key].ex)? 'checked' : '') + '>' +
//                         '<span name="' + key + '">' +  str + '</span><br>';
//        item.childNodes[0].onchange = this.cbx_onchange_entry;
//        item.childNodes[1].onchange = this.cbx_onchange_entry;
//        item.childNodes[2].onchange = this.cbx_onchange_entry;
//        item.childNodes[3].onmouseover = pref_func.tooltips.show;
//        this.pn.appendChild(item);
//      }
      if (pref.virtualBoard.show && !from_filter) this.update_boardlist();
    },
////    cbx_onchange_entry : function(e){liveTag.cbx_onchange(this, e, true);},
////    cbx_onchange : function(sender, e, from_cbx){ // working code.
////      var prop = sender.name.substr(-2,2);
//////      var val = e.target.checked;
////      var val = sender.checked;
////      var tag = sender.name.substr(0,sender.name.length-3);
    cbx_onchange_entry : function(e){
      var tag = this.name.substr(0,this.name.length-3);
      var prop = this.name.substr(-2,2);
      liveTag.tags[tag][prop] = this.checked;
      liveTag.cbx_onchange(tag, prop, true);
    },
    cbx_onchange : function(tag, prop, from_cbx){
      var val = this.tags[tag][prop];
      this.active[prop] += (val)? 1 : -1;
      if (prop==='pk') {
        if (val && !this.tags[tag]['in']) {
          this.tags[tag]['in'] = true;
          this.active['in'] += 1;
          this.tags[tag].pn.childNodes[1].checked = true;
//          this.update_pn_buf.delayed_do();
        }
        var tgts = {};
//        var now = Date.now();
//        var prev = now - pref.liveTag.pickup_interval*1000;
//        for (var i in this.tags)
//          if (this.tags[i]['pk'] && (this.tags[i]['pk']==='true' || this.tags[i]['pk']<prev)) {
//            this.tags[i]['pk']=now;
//            for (var j in this.tags[i].mems) tgts[j.substr(0,j.lastIndexOf('/')+1)]=null;
//          }
//        if (val) for (var i in this.tags[tag].tgts) for (var j in this.tags[i].mems) tgts[j.substr(0,j.lastIndexOf('/')+1)]=null; // working code.
//        if (val) for (var j in this.tags[tag].mems) tgts[j.substr(0,j.lastIndexOf('/')+1)]=null;
        if (val) for (var j of this.tags[tag].mems.keys()) tgts[j.key.substr(0,j.key.lastIndexOf('/')+1)]=null;
        if (Object.keys(tgts).length!=0 && catalog_obj && catalog_obj.catalog_func()!=null)
          catalog_obj.catalog_func().scan_boards.scan_init('refresh_tag',tgts, {callback:cataLog.catalog_refresh_watch});
      }
      if (prop==='in' || prop==='pk') {
        if (this.active['in']===1) pref.catalog.filter.tag = true;
        if (catalog_obj && catalog_obj.catalog_func()!=null) {
          pref_func.apply_prep(document.getElementsByTagName('input')['catalog.filter.tag'],false);
          catalog_obj.catalog_func().catalog_filter_changed();
        }
      }
      if (from_cbx) this.update_tag_node(tag);
    },
    search_by_tags : function(tags){ // working code.
      var retval = !this.active.in;
      if (this.active.in) for (j=0;j<2;j++) if (tags[j]) for (var i=0;i<tags[j].length;i++) if ((tags[j][i] in this.tags) && this.tags[tags[j][i]]['in']) {retval = true; break;}
      if (retval && this.active.ex) for (j=0;j<2;j++) if (tags[j]) for (var i=0;i<tags.length;i++) if ((tags[j][i] in this.tags) && this.tags[tags[j][i]]['ex']) {retval = false; break;}
      return retval;
    },
//    search_by_tags : function(tags){ // working code.
//      var retval = !this.active.in;
//      if (this.active.in) for (var i=0;i<tags.length;i++) if ((tags[i] in this.tags) && this.tags[tags[i]]['in']) {retval = true; break;}
//      if (retval && this.active.ex) for (var i=0;i<tags.length;i++) if ((tags[i] in this.tags) && this.tags[tags[i]]['ex']) {retval = false; break;}
//      return retval;
//    },
    keys_fix: null, // to reduce memory consumption.
    prep_tags : function(th, tags_old){ // prepare tag holder and extract tags in op. 'tags_old' for retag.
//      if (this.mems[th.domain] && this.mems[th.domain][th.board] && this.mems[th.domain][th.board][th.no]) return this.mems[th.domain][th.board][th.no];
//      else {
      var tag = this.mems.init(th);
      if (tag[2][10]===-1 || tags_old) {
        var watch = tag[2];
        if (pref.liveTag.watch_all && th.time_created) watch[0] = - catalog_obj.catalog_func().get_watch_time_of_a_thread(th.key, th.time_created);
        if (tag[2][10]===-1) tag[2][10]=1; // patch. This may be redundant.

        var tags_b = [[],[]]; // first time only.
        var tag_idx;
        if (pref.liveTag.inherit_board_name) { // working code.
          tag_idx = (pref.liveTag.lock_board_name)? 0 : 1;
          tags_b[tag_idx][0] = '#'+th.board.replace(/\//g,'');
        }
        if (pref.liveTag.inherit_board_tags && tag.btag2) {
          tag_idx = (pref.liveTag.lock_board_tags)? 0 : 1;
          tags_b[tag_idx] = tags_b[tag_idx].concat(tag.btag2);
        }

        common_func.set_value_to_root(watch,'9',[]); // patch
        site2[th.domain].check_reply.check_t1(th, watch);
        if (watch[9].length!=0) {
          tag_idx = (pref.liveTag.lock_tags_in_op)? 0 : 1;
          tags_b[tag_idx] = tags_b[tag_idx].concat(watch[9]);
//          tags_b[tag_idx] = watch[9].concat(tags_b[tag_idx]);
        }
        this.exclude_tags(th.key, tags_b);
        if (tags_old) for (var i=0;i<2;i++) if (tags_old[i]) tags_b[i] = tags_b[i].concat(tags_old[i]);
        if (tags_b[0].length!=0) tag[0] = this.update_tags_in_th(tags_b[0], null, {}, (tags_b[0].length < pref.liveTag.max)? tags_b[0].length : pref.liveTag.max, th, watch, this.mems[th.domain][th.board]); // update this.keys_fix
        if (tags_b[1].length!=0) {
          common_func.set_value_to_root(watch,'9',tags_b[1]); // patch
//          watch[9] = tags_b[1];
          this.extract_tags(th, this.keys_fix);
        } else {
          if (tag[1]!==null) tag[1] = null;
          this.update_pn_buf.delayed_do();
        }
      }
      return tag;
    },
    extract_tags : function(th, keys_fix){
      var tag = this.mems[th.domain][th.board][th.no];
      if (!keys_fix) {
        this.keys_fix = {};
        var t0 = tag[0]; // runs getter 1 times only.
        if (t0!==null && t0.length!=0) {
          if (pref.liveTag.ci) for (var i=0;i<t0.length;i++) this.keys_fix[t0[i].toLowerCase()] = t0[i];
          else for (var i=0;i<t0.length;i++) this.keys_fix[t0[i]] = t0[i];
        }
      }
      var tag_1 = this.update_tags_in_th(tag[2][9], tag[1], this.keys_fix, pref.liveTag.max-tag[0].length, th, tag[2], this.mems[th.domain][th.board]);
      if (tag_1.length!=0) tag[1] = tag_1;
      this.update_pn_buf.delayed_do();
      this.keys_fix = null;
//      else if (ur>=0) {
//        for (var j=0;j<2;j++) {
//          var tgt = tag[j];
//          for (var i=0;i<tgt.length;i++) this.check_update_tags_color(tgt[i],ur);
//        }
//      }
      return tag;
    },
    update_boardlist: function(force_redraw){
////      if (!site3[site.nickname].bds && site3[site.nickname].boards) { // working code.
//////        site3[site.nickname].bds = {};
////        for (var i=0;i<site3[site.nickname].boards.length;i++) site3[site.nickname].bds['/'+site3[site.nickname].boards[i].board+'/'] = null;
////      }
//      if (site.boardlist && site3[site.nickname].bds) {
      if (site.boardlist) {
        var i=0;
        var flag = force_redraw;
        var p = 0;
        var j=0;
        var p_remove = pref.virtualBoard.p_board==='both' && pref.virtualBoard.p_remove;
        while (i<pref.virtualBoard.max+p && i<this.tags_array_old.length) {
          var key = this.tags_array_old[i].key;
          if (p_remove && (('/'+key.substr(1)+'/') in this.mems[site.nickname])) p++;
          else {
            if (this.tags_boardlist[j]!==key) {
              this.tags_boardlist[j] = key;
              flag = true;
            }
            j++;
          }
          i++;
        }
        if (j!=this.tags_boardlist.length) {this.tags_boardlist.splice(j,this.tags_boardlist.length-j); flag=true;}
        if (flag) {
          var pn = this.update_tag_string(this.tags_boardlist, ' / ', this.boardlist_click_entry);
          site2[site.nickname].show_boardlist(pn);
        }
      }
    },
//    refresh_end_proc: function(){
//      for (var i in this.tags) if (this.tags[i].ur_cs===null) this.count_ur_sub(i);
//      for (var i in this.tags_update_state) this.tags[i].ur = null;
//      for (var i in this.tags_update_state) {
//        if (this.tags[i].ur===null) this.count_ur(i);
//        this.update_tag_node(i);
//      }
//      this.tags_update_state = Object.create(null);
//    },
    update_tag_node: function(tag, node_in_boardlist){
      if (cataLog.threads!==null) {
////if (!pref.test_mode['24']) {
        var keys = liveTag.tags[tag].mems_keys_obj(); // runs getter only 1 time. // working code.
        for (var name in keys)
          if (cataLog.threads[name] && cataLog.threads[name][24] && cataLog.threads[name][24][3])
            this.update_tag_node_1(cataLog.threads[name][24][3].getElementsByClassName(pref.script_prefix+'_tag'),keys[name]);
////} else {
////        for (var i of this.tags[tag].mems_keys()) {
////          var name = i.key;
////          if (cataLog.threads[name] && cataLog.threads[name][24] && cataLog.threads[name][24][3])
////            this.update_tag_node_1(cataLog.threads[name][24][3].getElementsByClassName(pref.script_prefix+'_tag'), this.tags[tag].mems.get(i)); // can't get tag when i is derived from board.
////        }
////}
      }
      tag = this.tags_ci[(pref.liveTag.ci)? tag.toLowerCase() : tag].key;
      if (node_in_boardlist) this.color_tag_node(node_in_boardlist, tag);
      else if (this.tags_boardlist.indexOf(tag)!=-1) this.update_tag_node_1(site.boardlist.getElementsByClassName(pref.script_prefix+'_tag'), tag);
    },
//    update_tag_node: function(tag, node_in_boardlist){ // working code.
//      if (catalog_obj && catalog_obj.catalog_func()!=null) {
//        var threads = catalog_obj.catalog_func().threads;
//        for (var t in liveTag.tags[tag].tgts) 
//          for (var name in liveTag.tags[t].mems) 
//            if (threads[name] && threads[name][24] && threads[name][24][3]) this.update_tag_node_1(threads[name][24][3].getElementsByClassName(pref.script_prefix+'_tag'),tag);
//      }
//      if (node_in_boardlist) this.color_tag_node(node_in_boardlist, tag);
//      else if (this.tags_boardlist.indexOf(tag)!=-1) this.update_tag_node_1(site.boardlist.getElementsByClassName(pref.script_prefix+'_tag'), tag);
//    },
    update_tag_node_1: function(pns, tag){
      var tag_ci = tag.toLowerCase();
      for (var j=0;j<pns.length;j++) {
        var txt = pns[j].textContent;
        if (txt===tag || (pref.liveTag.ci && txt.toLowerCase()===tag_ci)) {
          this.color_tag_node(pns[j],tag);
          break;
        }
      }
    },
    color_tag_node : function(node, tag){
      if (this.tags[tag]['in']) common_func.init_set_style(node,pref.liveTag.style_in_obj4);
      else if (pref.liveTag.style) {
        if (this.tags[tag].ur>2) common_func.init_set_style(node,pref.liveTag.style_urtm_obj4);
        else if (this.tags[tag].ur>0) common_func.init_set_style(node,pref.liveTag.style_ur_obj4);
        else common_func.init_set_style(node,null);
      } else common_func.init_set_style(node,null);
    },
    update_tag_string: function(tags, sep, func_click){
      var pn = document.createElement('span');
//      pn.setAttribute('class',pref.script_prefix+'_tag');
      pn.setAttribute('name',pref.script_prefix+'_tag_parent');
      if (tags) for (var j=0;j<tags.length;j++) {
        var key = tags[j];
        var pn_1 = document.createElement('span');
        pn_1.setAttribute('class',pref.script_prefix+'_tag');
        pn_1.textContent = key;
        this.color_tag_node(pn_1,key);
        pn_1.onclick = func_click;
        pn_1.onmouseover = this.tag_onmouseover;
        pn.appendChild(pn_1);
        pn.appendChild(document.createTextNode(sep));
      }
      return pn;
    },
    tag_node_onclick: function(){
      var tag = this.textContent;
      liveTag.tag_in_thread_onclick(tag);
      liveTag.update_tag_node(tag);
    }

//    extract_tags_in_posts : function(th, tags, name){
//      tag[1] = this.update_tags_in_th(tags, tag[1][0], tag[0][1], pref.liveTag.max-tag[0][0].length, name);
//      this.update_pn_buf.delayed_do();
//    },
  };
//  liveTag.cbx_onchange_entry = liveTag.cbx_onchange_entry(liveTag);
//  liveTag.update_pn_buf = new DelayBuffer(liveTag.update_pn.bind(liveTag), 500);
  liveTag.update_pn_buf = new DelayBuffer(liveTag.update_pn.bind(liveTag), pref.liveTag.disp_delay);
  liveTag.tags_ci = Object.getPrototypeOf(liveTag.tags);
  thread_reader_init();

////  function LiveTag(tags, mems){ // I want to use 'Tag', but this brings difficulty into search...
////    this.tags = tags || Object.create(null); // tags : tags[TAG] = {key:, num;, mem:, pk:, in:, ex:};  // summary tree.
////    this.mems = mems || Object.create(null); // mems : mems[DOMAIN_BOARD][TAG] = {'THREAD':null, ...}; // member tree.
//////    Object.defineProperty(this, 'filter', {get: this.prep_filter_value, enumerable:true, configurable:true});
////    this.pn = document.createElement('div');
////    this.cbx_onchange_entry = (function(myself){function(){myself.cbx_onchange(this.name, this.checked);}})(this);
////    this.footer_onclick_entry = (function(myself){function(){myself.footer_onclick(this.name);}})(this);
////    this.active = null;
////  }
////  LiveTag.prototype = {
////    cbx_onchange : function(name,checked){
////      var name = this.name.split('.');
////      this.tags[name[0]][name[1]] = checked;
////      this.prep_search();
//////      this.prep_filter_val();
//////      Object.defineProperty(this, 'filter', {get: this.prep_filter_value, enumerable:true, configurable:true});
////    },
////    extract_tags_in_op : function(pn) {
////      var tags = pn[brwsr.innerText].match(tags_scan_regex);
////      var tags_uniq = Object.create(null);
////      for (var i=tags.length-1;i>=0;i--) if (tags[i] in tags_uniq) tags.splice(i,1); else tags_uniq[tags[i]] = null; // uniq in Case Sensitive
////      if (tags.length>pref.catalog.tag.max) return [];
////      if (tags.length>pref.catalog.tag.ignore) tags.splice(0,tags.length-pref.catalog.tag.ignore);
////      return tags;
////    },
////    update_tags : function(ths, partial){
////      var tags_in_board = Object.create(null);
////      for (var i=0;i<ths.length;i++) {
////        for (var j=0;j<ths[i].tags.length;j++) {
////          if (!tags_in_board[ths[i].tags[j]]) tags_in_board[ths[i].tags[j]] = Object.create(null);
////          tags_in_board[ths[i].tags[j]][ths[i].no] = null;
////        }
////      }
////      var db = ths[0].domain + ths[0].board;
////      if (!this.mems[db]) this.mems[db] = Object.create(null);
////      var mems_db = this.mems[db];
////      var tags = this.tags;
////      if (!partial) {
////        for (var i in mems_db) {
////          if (i in tags_in_board) {
////            tags[i].num += Object.keys(tags_in_board[i]).length - Object.keys(mems_db[i]).length;
////            mems_db[i] = tags_in_board[i];
////            tags_in_board[i] = null;
////          } else {
////            tags[i].num -= Object.keys(mems_db[i]).length;
////            delete tags[i].mem[db];
////            if (tags[i].num==0 && !tags[i].pk && !tags[i].in && !tags[i].ex) delete tags[i];
////            delete mems_db[i];
////          }
////        }
////      } else {
////        for (var i in tags_in_board) {
////          if (in in mems_db) {
////            old_len = Object.keys(mems_db[i]).length;
////            for (var j in tags_in_board[i]) mems_db[i][j] = tags_in_board[i][j];
////            tags[i].num += Object.keys(mems_db[i]).length - old_len;
////            tags_in_board[i] = null;
////          }
////        }
////      }
////      for (var i in tags_in_board) {
////        if (tags_in_board[i]!==null) { // i isn't in mems_db
////          if (!(i in tags)) tags[i] = {key:i, num;0, mem:Object.create(null), pk:false, in:false, ex:false};
////          tags[i].num += Object.keys(tags_in_board[i]).length;
////          tags[i].mem[db] = null;
////          mems_db[i] = tags_in_board[i];
////        }
////      }
////    },
////    update_pn : function(ci){
////      var tags = this.tags;
////      var tags_array = [];
////      for (var i in tags) tags_array[tags_array.length] = tags[i];
////      tags_array.sort(this.sort_func);
////      if (ci) {
////        var tags_ci = Object.create(null);
////        for (var i=0;i<tags_array.length;i++) {
////          var key = tags_array[i].key.toLowerCase();
////          if (!(key in tags_ci)) tags_ci[key] = i;
////          else {
////            tags_array[tags_ci[key]].num += tags_array[i].num; // CAUSE OVERESTIMATION, BUT EXECUTION SPEED HAS MORE PRIORITY, THEREFORE LEAVE THIS.
////            tags_array[tags_ci[key]].pk  |= tags_array[i].pk;
////            tags_array[tags_ci[key]].in  |= tags_array[i].in;
////            tags_array[tags_ci[key]].ex  |= tags_array[i].ex;
////            tags_array.splice(i,1);
////            i--;
////          }
////        }
////        tags_array.sort(this.sort_func);
////      }
////      this.pn.innerHTML = '';
////      for (var i=0;i<tags_array.length;i++) {
////        var item = document.createElement('span');
////        var str  = tags_array[i].num + ': ' + tags_array[i].key;
////        item.innerHTML = '<input type="checkbox" name="' + tags_array[i].key + '.pk" ' + ((tags_array[i].pk)? 'checked' : '') + '>' + 
////                         '<input type="checkbox" name="' + tags_array[i].key + '.in" ' + ((tags_array[i].in)? 'checked' : '') + '>' + 
////                         '<input type="checkbox" name="' + tags_array[i].key + '.ex" ' + ((tags_array[i].ex)? 'checked' : '') + '>' + str + '<br>';
////        item.childNodes[0].onchange = this.cbx_onchange_entry;
////        item.childNodes[1].onchange = this.cbx_onchange_entry;
////        item.childNodes[2].onchange = this.cbx_onchange_entry;
////        this.pn.appendChild(item);
////      }
////    },
////    prep_search : function(){
////      var active = {pk:false, in:false, ex:false};
////      var tags = this.tags;
////      for (var i in tags) if (tags[i].pk) {active.pk = true; break;}
////      for (var i in tags) if (tags[i].in) {active.in = true; break;}
////      for (var i in tags) if (tags[i].ex) {active.ex = true; break;}
////      this.active = active;
////    }
////    get_pick_up_mems : function(){
////      var retval = {};
////      if (this.active.pk) for (var i in tags) if (tags[i].pk) for (var j in tags[i].mem) retval[j] = null;
////      return retval;
////    },
//////    prep_filter_value : function(){
//////      var retval = {pk:Object.create(null), in:Object.create(null), ex:Object.create(null)};
//////      for (var i in this.tags) {
//////        if (this.tags[i].pk) retval.pk[i] = null;
//////        if (this.tags[i].in) retval.in[i] = null;
//////        if (this.tags[i].ex) retval.ex[i] = null;
//////      }
//////      Object.defineProperty(this, 'filter', {value: retval, writable:true, enumerable:true, configurable:true});
//////    },
////    prep_footer : function(tags){
////      var ft = document.createElement('span');
////      ft.setAttribute('style','cursor:pointer');
////      for (var i=tags.length-1;i>=0;i--) {
////        var tag_pn = document.createElement('span');
////        tag_pn.innerHTML = tags[i] + ' ';
////        tag_pn.onclick = this.footer_onclick_entry;
////        ft.appendChild(tag_pn);
////      }
////      return ft;
////    },
////    footer_onclick : function(name) {
////      var sel = pref.tag.footer_clicked;
////      this.tags[name][sel] = !this.tags[name][sel];
////      this.pn.getElementsByTagName('input')[name+'.'+sel] = this.tags[name][sel];
////    },

  function make_catalog_obj(pn12_button){
    var catalog_func = null;
    function show_hide(){
      if (catalog_func===null) catalog_func = make_catalog(pn12_button);
      else catalog_func = catalog_func.destroy();
    }
    var embed_catalog = pref.catalog.embed && site.whereami==='catalog';
    var embed_page    = pref.catalog.embed_page && site.whereami==='page';
    var embed_frame   = pref.catalog.embed_frame && site.whereami==='frame';
    if (embed_page && pref.catalog_max_page_auto) pref.catalog_max_page = site2[site.nickname].set_max_page();
    if (embed_catalog || embed_page) {
////      pref.catalog_board_list_sel = 0;
////      pref.catalog.filter.show = true;
////      pref.catalog_show_setting = true;
////      pref.catalog.design = 'catalog';
//      show_hide();  // moved after making software cache because of subscription.
//      if (brwsr.ff || site.settings) pn12_button.textContent = 'Frame'; // working code.
//      else pn12_button.getElementsByTagName('input')[0].value = 'Frame';
    } else {
////      pref.catalog.design = 'page';
      pn12_button.addEventListener('click', show_hide, false); // show_hide
    }
if (!(brwsr.ff && embed_catalog && site.nickname==='4chan')) { // patch, but WHY???
//    var ss = document.styleSheets[document.styleSheets.length-1];
//    if (!ss) {
//      var ss = document.createElement('style');
//      document.head.appendChild(ss);
//      ss = ss.sheet;
//    }
    var ss = document.head.appendChild(document.createElement('style')).sheet;
    ss.insertRule('.catalog_triage_parent {pointer-events: none;}',0); 
    ss.insertRule('.catalog_triage_button {pointer-events: auto;}',1);
    pref_func.style_sheet = ss;
    pref_func.settings.onchange_funcs['catalog_click_area_add_rule'](); // rule 2.
    ss.insertRule('.'+pref.script_prefix+'_tag {cursor:pointer;}',3);
}
      
    function scan_tags_common(ths,html_str,tags_obj){
      var acc = true;
      if (tags_obj===undefined) {
        tags_obj = {cs:{}, ci:{}};
        acc = false;
      }
      for (var i in ths) {
        var tags_th = ths[i].tags;
        if (tags_th) {
          var dbt = cnst.name2domainboardthread(i,true);
          var tags_th_uniq = {};
          for (var j=tags_th.length-1;j>=0;j--)
            if (tags_th_uniq[tags_th[j]]===undefined) tags_th_uniq[tags_th[j]] = null; // BUG. #aaa and #AAA are counted as 2 in case insensitive mode.
            else tags_th.splice(j,1);
          if (tags_th.length<=pref.catalog.tag.max) {
            var end = (pref.catalog.tag.ignore<tags_th.length)? pref.catalog.tag.ignore : tags_th.length;
            for (var j=0;j<end;j++) {
              for (var k in tags_obj) {
                var tag_test = (k==='cs')? tags_th[j] : tags_th[j].toLowerCase();
                if (tags_obj[k][tag_test]===undefined) tags_obj[k][tag_test] = {num:1,mem:{}};
                else tags_obj[k][tag_test].num++;
                if (!tags_obj[k][tag_test].mem[dbt[0]+dbt[1]]) tags_obj[k][tag_test].mem[dbt[0]+dbt[1]] = 1;
                else tags_obj[k][tag_test].mem[dbt[0]+dbt[1]]++;
      }}}}}
      if (!acc) return scan_tags_common_b(tags_obj,html_str,{cs:[],ci:[]})[0];
    }
    function scan_tags_common_b(tags_obj, html_str, tags){ // CAN'T FIND 1->0 AT A BOARD.
      for (var i in tags_obj) {
        for (var j in tags_obj[i]) {
          var tag_ref = (i==='cs')? j : j.toLowerCase();
          for (var n=0;n<tags[i].length;n++) {
            var tag_test = (i==='cs')? tags[i][n].key : tags[i][n].key.toLowerCase();
            if (tag_ref===tag_test) {
              for (var k in tags_obj[i][j].mem) tags[i][n].mem[k] = tags_obj[i][j].mem[k]; // update.
//var old = tags[i][n].num;
              tags[i][n].num = 0;
              for (var k in tags[i][n].mem) tags[i][n].num += tags[i][n].mem[k];
//if (old!=tags[i][n].num) console.log(i+', '+j+', '+n+', '+tag_test+', '+old+', '+tags[i][n].num);
              delete tags_obj[i][j]; // works in Chrome and FF, BUT DANGEROUS?
              break;
            }
          }
        }
        for (var j in tags_obj[i]) tags[i].push({key:j, num:tags_obj[i][j].num, mem:tags_obj[i][j].mem});
//        tags[i].sort(function(a,b){return b.num - a.num;});
        tags[i].sort(function(a,b){return (b.num!=a.num)? b.num - a.num : (b.key > a.key)? -1:1;});
      }
      for (var i=0;i<tags.ci.length;i++) {
        var key = tags.ci[i].key.toLowerCase();
        for (var j=0;j<tags.cs.length;j++)
          if (key===tags.cs[j].key.toLowerCase()) {tags.ci[i].key=tags.cs[j].key; break;}
      }
      return scan_tags_common_c(tags, html_str);
    }
    function scan_tags_common_c(tags, html_str){
      var tags_tgt = (pref.catalog.filter.tag_ci)? tags.ci : tags.cs;
      var str2 = '';
      for (var i=0;i<tags_tgt.length;i++) {
        var item = tags_tgt[i].num + ': ' + tags_tgt[i].key;
        str2 = str2 + '<input type="checkbox"' + html_str + '> '+item + '<br>';
      }
      return [str2, tags];
    }
//    function scan_tags_common(ths,html_str,tags_obj){
//      var acc = true;
//      if (tags_obj===undefined) {
//        tags_obj = {cs:{}, ci:{}};
//        acc = false;
//      }
//      for (var i in ths) {
//        var tags_th = ths[i].tags;
//        if (tags_th) {
//          var dbt = cnst.name2domainboardthread(i,true);
//          var tags_th_uniq = {};
//          for (var j=tags_th.length-1;j>=0;j--)
//            if (tags_th_uniq[tags_th[j]]===undefined) tags_th_uniq[tags_th[j]] = null;
//            else tags_th.splice(j,1);
//          if (tags_th.length<=pref.catalog.tag.max) {
//            var end = (pref.catalog.tag.ignore<tags_th.length)? pref.catalog.tag.ignore : tags_th.length;
//            for (var j=0;j<end;j++) {
//              for (var k in tags_obj) {
//                var tag_test = (k==='cs')? tags_th[j] : tags_th[j].toLowerCase();
//                if (tags_obj[k][tag_test]===undefined) tags_obj[k][tag_test] = {num:0,mem:{}};
//                tags_obj[k][tag_test].num++;
//                tags_obj[k][tag_test].mem[dbt[0]+dbt[1]] = null;
//      }}}}}
//      if (!acc) return scan_tags_common_b(tags_obj,html_str)[0];
//    }
//    function scan_tags_common_b(tags_obj,html_str){
//      var tags = [];
//      for (var i in tags_obj.cs) tags.push({key:i, num:tags_obj.cs[i].num, mem:tags_obj.cs[i].mem});
//      tags.sort(function(a,b){return b.num - a.num;});
//      if (pref.catalog.filter.tag_ci) {
//        for (var i=0;i<tags.length-1;i++) {
//          var key = tags[i].key.toLowerCase();
//          tags[i].num = tags_obj.ci[key].num;
//          tags[i].mem = tags_obj.ci[key].mem;
//          for (var j=tags.length-1;j>i;j--) if (key===tags[j].key.toLowerCase()) tags.splice(j,1);
//        }
//        tags.sort(function(a,b){return b.num - a.num;});
//      }
//      var str2 = '';
//      for (var i=0;i<tags.length;i++) {
//        var item = tags[i].num + ': ' + tags[i].key;
//        str2 = str2 + '<input type="checkbox"' + html_str + '> '+item + '<br>';
//      }
//      return [str2, tags];
//    }
////    function scan_tags_common(ths,html_str,tags_obj,acc){
////      if (tags_obj===undefined) tags_obj = {};
//////      var tags_obj = {};
////      for (var i in ths) {
////        var tags_th = ths[i].tags;
////        if (tags_th) {
////          var tags_th_uniq = {};
////          for (var j=tags_th.length-1;j>=0;j--)
////            if (tags_th_uniq[tags_th[j]]===undefined) tags_th_uniq[tags_th[j]] = null;
////            else tags_th.splice(j,1);
////          if (tags_th.length<=pref.catalog.tag.max) {
////            var end = (pref.catalog.tag.ignore<tags_th.length)? pref.catalog.tag.ignore : tags_th.length;
////            for (var j=0;j<end;j++) {
////              if (tags_obj[tags_th[j]]===undefined) tags_obj[tags_th[j]] = [0,{}];
////              tags_obj[tags_th[j]][0]++;
////              tags_obj[tags_th[j]][1][i] = 0;
////            }
////          } 
////        }
////      }
////      if (!acc) return scan_tags_common_b(tags_obj,html_str);
////    }
////    function scan_tags_common_b(tags_obj,html_str){
////      var tags = [];
////      for (var i in tags_obj) tags.push({key:i, val:tags_obj[i][0], mem:tags_obj[i][1]});
////      tags.sort(function(a,b){return b.val - a.val;});
////      if (pref.catalog.filter.tag_ci) {
////        for (var i=0;i<tags.length-1;i++) {
////          var key = tags[i].key.toLowerCase();
////          for (var j=tags.length-1;j>i;j--) {
////            if (key===tags[j].key.toLowerCase()) {
//////console.log(tags[i].key+', '+tags[i].val +' + '+tags[j].key+', '+tags[j].val);
////              tags[i].val += tags[j].val;
////              for (var k in tags[j].mem) tags[i].mem[k] = 0;
////              tags.splice(j,1);
////            }
////          }
////        }
////        for (var i in tags) tags[i].val = Object.keys(tags[i].mem).length;
////        tags.sort(function(a,b){return b.val - a.val;});
////      }
////      var str2 = '';
////      for (var i=0;i<tags.length;i++) {
////        var item = tags[i].val + ': ' + tags[i].key;
////        str2 = str2 + '<input type="checkbox"' + html_str + '> '+item + '<br>';
////      }
////      return str2;
////    }

    function make_catalog(pn12_button){
      if (brwsr.sw_cache && pref.info_client) brwsr.sw_cache.subscribe(true);
//      var threads = []; // This makes non-associative array.
      var threads = {}; // This makes object.
      cataLog.threads = threads;
      var threads_idx = [];
      var pop_up_status = {};
      var boards = {};
//      var threads_last_deleted = {};
      var initialize_loop = true;

      var pn12_0_4 = document.createElement('div');
      var pn12_whole = cnst.init('left:0px:tile:get:bottom:resize:both:Show:tb:width:'+pref.catalog.appearance.initial.width+'px:height:'+pref.catalog.appearance.initial.height+'px:resize:both:overflow:auto',
        function(){pn12_0_4.style.display='';},function(){pn12_0_4.style.display='none';},show_hide,show_catalog_cont);
      var pn12 = pn12_whole[0];
      var pn12_rollup_func = pn12_whole[1];

//// test for prototype base coding.
////      var pn12_whole = new Cnst2('left:0px:tile:get:bottom:resize:both:Show:tb:width:400px:height:400px:resize:both:overflow:auto',
////        {rolldowm:function(){pn12_0_4.style.display='';}, rollup:function(){pn12_0_4.style.display='none';}, exit:show_hide, maximize:show_catalog_cont});
////      var pn12 = pn12_whole.pn;
////      var pn12_rollup_func = pn12_whole.funcs.rollup;

      cnst.bottom_top(pn12);
      var pn12_0 = pn12.childNodes[0];
      var pn12_1 = pn12.childNodes[1];
//      pn12_1.innerHTML = '<div style="display:none"></div><div></div>'; // doesn't work
//      pn12_1.innerHTML = '<div style="display:none"></div><div style="width:inherit;height:800px;resize:both;overflow:auto"></div>'; // doesn't work
//      pn12_1.innerHTML = '<div style="display:none"></div><div style="width:inherit;height:inherit;resize:both;overflow:auto"></div>'; // doesn't work
//    var pn12_0_4 = pn12_1.childNodes[0];
//      var pn12_1_1 = pn12_1.childNodes[1];
      pn12_1.id = 'catalog_debug';
      var autorollup_state = false;
      function auto_hide_catalog() {
        if (pref.catalog_auto_rollup_when_moving) {
          if (pn12_1.style.display!='none') {
            pn12_rollup_func();
            autorollup_state = true;
          } else if (autorollup_state) {
            pn12_rollup_func();
            autorollup_state = false;
          }
        }
      }
      pn12.addEventListener('dragstart', auto_hide_catalog, false);
      pn12.addEventListener('dragend'  , auto_hide_catalog, false);
      var pn12_0_2 = cnst.add_to_tb(pn12,
//        '<label name="filter"><input type="checkbox" name="catalog.filter.show"> Filter </label>' +
//        '<label name="settings"><input type="checkbox" name="catalog_show_setting"> Settings</label>'+
        '<button name="filter"><img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcAQAAAABaduI5AAAAAnRSTlMAAQGU/a4AAABUSURBVAjXY/j///8HBjAx////CQz8//8zMLD//8fAwPz/DwND4/8fAgwH/n8wYHhQ/6CA4YP9gQ8MP+QbPzD84Wf+wPCPnx2ol5+fLKJfHmovnAAAn79HiYOE2q8AAAAldEVYdGRhdGU6Y3JlYXRlADIwMTUtMTAtMjlUMDI6MTM6MzkrMDk6MDBxKtFiAAAAJXRFWHRkYXRlOm1vZGlmeQAyMDE1LTEwLTI5VDAyOjEzOjM5KzA5OjAwAHdp3gAAAABJRU5ErkJggg==" style="width:14px;height:14px"></button>' +
        '<button name="settings"><img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcAQAAAABaduI5AAAAAnRSTlMAAQGU/a4AAABWSURBVAjXdY6xDcAgDAQvGzAKG2QllykiwWgexWxgKQ2dI4yULs1X9/dPWHMyHrudYZegvVQ6FBQqdqrgzRwLF0ZM4YjJfySS8K4tQaq2dOlzKCe/By9fz0MDWLKIZgAAACV0RVh0ZGF0ZTpjcmVhdGUAMjAxNS0xMC0yOVQwMjowMzowNiswOTowMMhjeagAAAAldEVYdGRhdGU6bW9kaWZ5ADIwMTUtMTAtMjlUMDI6MDM6MDYrMDk6MDC5PsEUAAAAAElFTkSuQmCC" style="width:14px;height:14px"></button>'+
//        '<button name="refresh">Refresh</button>'+
//        '<button name="refresh">\u27f3</button>'+
        '<button name="refresh"><img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcAQAAAABaduI5AAAAAnRSTlMAAQGU/a4AAABmSURBVAjXbY6xDYAwDASfijLegBUYLRuAlCIljITEAowQNnCZIspjQ0tzkvX6e4NKBREudIw7KgaBTqugLEVwUwWnI9HOzMNh6UarhR+8QWaXD4nNBW02VY0ujdAA9SH1yXfcYG88J0BH+yT9vZAAAAAldEVYdGRhdGU6Y3JlYXRlADIwMTUtMTAtMjhUMjM6NDg6MDYrMDk6MDASyn1kAAAAJXRFWHRkYXRlOm1vZGlmeQAyMDE1LTEwLTI4VDIzOjQ4OjA2KzA5OjAwY5fF2AAAAABJRU5ErkJggg==" style="width:14px;height:14px"></button>'+
        '<span name="num_of_pages">'+
          '<span name="hide_at_embed"> up to <input type="text" name="catalog_max_page" size="2" style="text-align: right;">pages in </span></span>'+
        '<span name="boards_selector"><select name="catalog_board_list_sel"></select></span>');
      pref_func.apply_prep(pn12_0_2,false);
      var pn12_0_2_childs = ['filter','settings','refresh','num_of_pages','boards_selector'];
      for (var i=0;i<pn12_0_2_childs.length;i++)
        if (!pref.catalog.appearance.titleBar[pn12_0_2_childs[i]]) pn12_0_2.getElementsByTagName('*')[pn12_0_2_childs[i]].style.display = 'none';
      pn12_1.style.width = pn12_0.offsetWidth + 'px';
      var board_sel = pn12_0_2.getElementsByTagName('select')['catalog_board_list_sel'];
      board_sel.onfocus = function(){
        for (var j=0;j<this.length;j++)
          this.options[j].text = pref.catalog_board_list_obj[j][0].key;
      };
      board_sel.onblur = function(){
        for (var j=0;j<this.length;j++)
          if (j!=this.selectedIndex) this.options[j].text = '';
      };
      board_sel.onblur();
      pref_func.board_sel = board_sel;

////      var health_indicator = (function(){
////        var pn_hi = document.createElement('span');
//////        if (!(embed_catalog)) pn_hi.style['font-size'] = '24px';
////        if (!pref.catalog.health_indicator.on) pn_hi.style.display = 'none';
////        pn12_0.childNodes[3].appendChild(pn_hi);
////        function insert_node(col,str){
////          var max = pref.catalog.health_indicator.max;
////          while (pn_hi.childNodes.length>=max) pn_hi.removeChild(pn_hi.lastChild);
////          return pn_hi.insertBefore(new Indicator(col,str), pn_hi.firstChild);
////        }
////        function Indicator = function(col,str){
////          this.pn = document.createElement('span');
////          if (col) this.pn.setAttribute('style','color:'+col);
////          if (str) this.pn.innerHTML = str;
////        }
////        Indicator.prototype = {
////          set: function(col,str){
////            if (str) this.pn.textContent = str;
////            if (col) this.pn.style.color = col;
////          },
////          remove: function(){this.pn.parentNode.removeChild(this.pn);}
////        }
////        pref_func.health_indicator = pn_hi;
////        return {
////          pn_hi : pn_hi,
////          shift : insert_node,
////        }
////      })();

      var health_indicator = (function(){
        var pn_hi = document.createElement('span');
//        if (!(embed_catalog)) pn_hi.style['font-size'] = '24px';
        if (!pref.catalog.health_indicator.on) pn_hi.style.display = 'none';
        pn12_0.childNodes[3].appendChild(pn_hi);
        function insert_node(col,str){
          var max = pref.catalog.health_indicator.max;
          while (pn_hi.childNodes.length>=max) pn_hi.removeChild(pn_hi.lastChild);
          var pn = document.createElement('span');
          if (col) pn.setAttribute('style','color:'+col);
          if (str) pn.innerHTML = str;
          pn_hi.insertBefore(pn,pn_hi.firstChild);
          return pn;
//          while (pn_hi.childNodes.length>=max) pn_hi.removeChild(pn_hi.childNodes[pn_hi.childNodes.length-1]);
//          pn_hi.innerHTML = '<span' + ((col)? ' style="color:'+col+'"' : '' ) + '>'+str+'</span>' + pn_hi.innerHTML;
        }
        pref_func.health_indicator = pn_hi;
        return {
          pn_hi : pn_hi,
          set: function(pn,col,str){
//            if (!pn) pn = pn_hi.childNodes[0];
            if (str) pn.textContent = str;
            if (col) pn.style.color = col;
          },
          shift: function(col,str){return insert_node(col,str);},
          remove: function(pn){
            pn.parentNode.removeChild(pn);
          }
        }
      })();

      pn12_0_4.style.margin = '0px 3px';
      pn12_0.appendChild(pn12_0_4);
      pn12_0_4.innerHTML = 
        '<div style="float:right">'+
          '<div style="float:right">'+
            '<input type="checkbox" name="catalog_auto_update"> Auto update<br>'+
            '&emsp;&emsp;<input type="text" name="catalog_auto_update_period" size="3" style="text-align: right;"> min.<br>'+
            '<input type="checkbox" name="catalog_snoop_refresh" checked> Snoop update<br>'+
            '&emsp;<input type="checkbox" name="catalog_promiscuous"> Promiscuous<br>'+
            '<input type="checkbox" name="catalog_refresh_clear"> Clear latter than<br>'+
            '&emsp;<input type="text" name="catalog.max_threads_at_refresh" size="4" style="text-align: right;">th at update<br>'+
            '<button name="clear_threads">Clear</button>'+
          '</div>'+
          '<div style="float:right">'+
            '<div name="hide_at_embed">'+
//              '<select name="catalog.indexing"><option>Last reply</option><option>Creation date</option><option>Reply count</option><option>Image count</option></select><br>'+
              '<select name="catalog.indexing"><option>Last reply</option><option>Creation date</option><option>Reply count</option><option>Image count</option><option>Last reply</option></select><br>'+
              'size '+
              '<span name="catalog.text_mode.mode.graphic">'+
                '<input type="text" name="catalog_size_width" size="4" style="text-align: right;"> x '+
                '<input type="text" name="catalog_size_height" size="4" style="text-align: right;"></span>'+
              '<span name="catalog.text_mode.mode.text">'+
                '<input type="text" name="catalog_size_text_width" size="4" style="text-align: right;"> x '+
                '<input type="text" name="catalog_size_text_height" size="4" style="text-align: right;"></span>'+
            '</div>'+
            '<div>'+
//              '&emsp;Order<br>'+
              '<input type="checkbox" name="catalog.order.reply_to_me"> New reply to me at first<br>'+
              '<input type="checkbox" name="catalog.order.reply"> New reply at first<br>'+
//              '<input type="checkbox" name="catalog.order.watch"> Watch listed at first<br>'+
              'Watch listed:<br>'+
              '&emsp;<input type="radio" name="catalog.order.watch" value="first"> at first<br>'+
              '&emsp;<input type="radio" name="catalog.order.watch" value="last"> at last<br>'+
              '&emsp;<input type="radio" name="catalog.order.watch" value="dont_care"> don\'t care<br>'+
              'Sticky:<br>'+
              '&emsp;<input type="radio" name="catalog.order.sticky" value="first"> at first<br>'+
              '&emsp;<input type="radio" name="catalog.order.sticky" value="last"> at last<br>'+
              '&emsp;<input type="radio" name="catalog.order.sticky" value="dont_care"> don\'t care<br>'+
//              '&emsp;<input type="radio" name="catalog.order.sticky" value="hide"> hide<br>'+
            '</div>'+
          '</div>'+
//          '<div style="float:right">'+
//            '<div name="hide_at_embed">'+
//              '<input type="radio" name="catalog.text_mode.mode" value="graphic"> Graphical mode<br>'+
//              '<input type="radio" name="catalog.text_mode.mode" value="text"> Text mode<br>'+
//            '</div>'+
//          '</div>'+
        '</div>'+
        '<div align="left" style="float:left">'+
          '<div style="float:left">'+
            '<div>'+
              '<input type="checkbox" name="catalog.filter.kwd.use"> Keyword :'+
//              '<textarea style="height:1em" cols="25" name="catalog.filter.kwd.str"></textarea>'+
              '<input type="text" name="catalog.filter.kwd.str" size="25">'+
              '<select name="catalog.filter.kwd.match">'+
                '<option>match all</option>'+
                '<option>match any</option>'+
                '<option>unmatch all</option>'+
                '<option>unmatch any</option>'+
              '</select>'+
//              '<input type="radio" name="catalog.filter.kwd.match" value="match">match_all '+
//              '<input type="radio" name="catalog.filter.kwd.match" value="match_any">match_any '+
//              '<input type="radio" name="catalog.filter.kwd.match" value="unmatch">unmatch_all '+
//              '<input type="radio" name="catalog.filter.kwd.match" value="unmatch_any">unmatch_any '+
              '<input type="checkbox" name="catalog.filter.kwd.re">RE '+
              '<input type="checkbox" name="catalog.filter.kwd.ci">CI <br>'+
              '&emsp;(<input type="checkbox" name="catalog.filter.kwd.sub">Subject '+
              '<input type="checkbox" name="catalog.filter.kwd.name">Name '+
//              '<input type="checkbox" name="catalog.filter.kwd.trip">Tripcode '+
              '<input type="checkbox" name="catalog.filter.kwd.com">Comment '+
              '<input type="checkbox" name="catalog.filter.kwd.file">Filename)'+
              ' in (<input type="checkbox" name="catalog.filter.kwd.op">OP '+
              '<input type="checkbox" name="catalog.filter.kwd.post">Posts)'+
            '</div>'+
            '<div style="float:left">'+
              '<input type="checkbox" name="catalog.filter.tag"> Tag :'+
            '</div>'+
            '<div style="float:left;overflow:auto;resize:both;" name="catalog.filter.tag_list"></div>'+
            '<div style="float:left;overflow:auto;resize:both;" name="catalog.filter.tag_board_list"></div>'+
            '<input type="text" name="catalog.filter.tag_filter_str" size="25">'+
//            '<button name="scan">scanBoard</button>'+
//            '<textarea style="height:1em" cols="25" name="catalog.filter.tag_list_str"></textarea>'+
//            '<input type="checkbox" name="catalog.filter.tag_scan_auto"> Auto'+
//            '<input type="checkbox" name="catalog.filter.tag_ci"> Case insensitive<br>'+
            '<div style="clear:both"></div>'+
            '<input type="checkbox" name="catalog.filter.time"> Time: '+
            '<input type="checkbox" name="catalog.filter.time_mark"> Mark: '+
            '<input type="checkbox" name="catalog.filter.time_watch"> Watch: '+
            '<input type="checkbox" name="catalog.filter.time_watch_creation"> Watch(creation time): '+
//            '<textarea style="height:1em" cols="25" name="catalog.filter.time_str"></textarea>'+
            '<input type="text" name="catalog.filter.time_str" size="25">'+
            '<!-- <button name="now"><- Now</button> -->'+
            '<button name="ago"><- Ago</button>'+
//            '<textarea style="height:1em" cols="6" name="catalog.filter.time_ago_str"></textarea><br>'+
            '<input type="text" name="catalog.filter.time_ago_str" size="6" style="text-align: right;">'+
            '<input type="checkbox" name="catalog.filter.time_ago_str_sync_at_refresh">Sync at refresh<br>'+
//            '<!-- &emsp;&emsp;<input type="checkbox" name="catalog.filter.time_track"> From the last post of the thread in which you click<br> -->'+
//            '<!-- <textarea style="height:1em" cols="25" name="catalog.filter.time_mark_str"></textarea> -->'+
//            '<!-- <button name="copy"><- From time filter</button><br> -->'+
          '</div>'+
          '<div>'+
            '<button name="scanSite">scanSite</button> '+
            '<span name="scan_progress"></span><br>'+
            '<button name="clear_threads">ClearAllThreads</button>'+
            '<input type="checkbox" name="catalog.filter.scan_clear_auto">Auto <br>'+
//            '<div style="float:left;overflow:auto;resize:both;" name="catalog.filter.tag_site_list"></div>'+
            '<input type="checkbox" name="catalog.filter.tag_scansite">scan tags<br>'+
          '</div>'+
          '<div style="clear:both"></div>'+
          '<div style="float:left">'+
            '<input type="checkbox" name="catalog.filter.list"> Exclusive list: '+
            '<input type="checkbox" name="catalog.filter.list_mark_time"> Mark:<br>'+
            '<!-- &emsp;<input type="checkbox" name="catalog.filter.list_time_scroll"> Scroll to new post -->'+
            '<div style="clear:both">&emsp;<textarea style="height:1em" cols="20" name="catalog.filter.list_str"></textarea></div>'+
          '</div>'+
          '<div style="float:left">'+
            '<div style="float:left"><input type="checkbox" name="catalog.filter.attr_list"> Attribute list:<br></div>'+
            '<div style="clear:both">&emsp;<textarea style="height:1em" cols="20" name="catalog.filter.attr_list_str"></textarea></div>'+
          '</div>'+
          '<div style="float:left">'+
            'Watch list: '+
            '<input type="checkbox" name="catalog.filter.watch_list_mark_time"> Mark:<br>'+
            '&emsp;<textarea style="height:1em" cols="20" name="catalog.filter.watch_list_str"></textarea>'+
          '</div>'+
          '<div style="float:left">'+
            '<input type="checkbox" name="catalog.filter.bookmark_list"> Bookmark list: '+
            '<input type="checkbox" name="catalog.filter.bookmark_list_rm404"> remove 404<br>'+
            '&emsp;<textarea style="height:1em" cols="20" name="catalog.filter.bookmark_list_str"></textarea>'+
          '</div>'+
          '<div style="float:left">'+
            '<button name="load">load</button><input type="checkbox" name="catalog.auto_load_filter"> Auto'+
            '&emsp;<button name="load_default">clear_filters</button><br>'+
            '<button name="save">save</button><input type="checkbox" name="catalog.auto_save_filter"> Auto<br>'+
          '</div>'+
        '</div>'+
        '<div style="clear:both"></div>';
      if (!embed_catalog && !embed_page) pn12_0_4.style.background = '#e5ecf9';
      else if (embed_catalog) {
        pn12_0_2.getElementsByTagName('span')['hide_at_embed'].style.display = 'none';
        pn12_0_4.getElementsByTagName('div')['hide_at_embed'].style.display = 'none';
        site2[site.nickname].catalog_native_frame_prep(pn12,pn12_button);
      }
      var hide_target = (pref.catalog.text_mode.mode==='text')? 'catalog.text_mode.mode.graphic' : 'catalog.text_mode.mode.text';
      pn12_0_4.getElementsByTagName('span')[hide_target].style.display = 'none';
      filter_kwd_prep(pref.catalog.filter.kwd,true); // prep kwd.kwds

      if (pref.tooltip.show) pref_func.tooltips.add_hier(pn12_0_4);
      pref_func.apply_prep(pn12_0_4,false);
      pref_func.apply_prep(pn12_0_4,true); // obj init.
//      function catalog_setting_onchange_event(){
////console.log(this);
//        pref_func.apply_prep(this,true);
//        if (onchange_funcs[this.name]) onchange_funcs[this.name]();
//      }
      var catalog_board_list_sel_old = pref.catalog_board_list_sel;
      var onchange_funcs = {
//        'catalog.filter.show' : function(){cnst.show_hide(pn_filter,pn12_1);},
//        'catalog_show_setting': function(){cnst.show_hide(pn_setting,pn12_1);},
        'filter' : function(myself){cnst.show_hide(pn_filter,pn12_1);common_func.toggleButton(myself);},
        'settings': function(myself){cnst.show_hide(pn_setting,pn12_1);common_func.toggleButton(myself);},
//        'refresh'             : function(){catalog_refresh(true,null,false);},
        'refresh'             : function(){auto_update.timer_tgt(true);},
        'catalog_board_list_sel' : function(){
          if (pref.catalog.auto_save_filter && localStorage)
            localStorage.setItem(onchange_funcs.load_save_key(catalog_board_list_sel_old),
              JSON.stringify(pref_func.obj_elim_the_same(pref_default().catalog.filter, pref.catalog.filter)));
          if (pref.catalog.refresh.at_switch) catalog_clear_threads(0);
          catalog_refresh(pref.catalog.refresh.at_switch,null,false);
          if (pref.catalog.auto_load_filter) onchange_funcs.load();
          catalog_board_list_sel_old = pref.catalog_board_list_sel;
        },
        'catalog_size_width'  : catalog_resized,
        'catalog_size_height' : catalog_resized,
        'catalog_size_text_width'  : catalog_resized,
        'catalog_size_text_height' : catalog_resized,
        'catalog.indexing'    : re_sort_thread,
//        'catalog.indexing'    : function(){
//          threads_idx=[];
//          for (var i in threads) insert_thread_idx(i);
//          show_catalog();
//        },
        'catalog_auto_update' : function(){auto_update.set()},
        'catalog_auto_update_period' : 'catalog_auto_update',
        'clear_threads'       : function(){catalog_clear_threads(0);show_catalog();},
        'load'                : function(){
          if (localStorage) {
            pref_func.pref_overwrite(pref.catalog.filter,pref_default().catalog.filter);
            pref_func.pref_overwrite(pref.catalog.filter,JSON.parse(localStorage.getItem(onchange_funcs.load_save_key(board_sel.selectedIndex))),true);
            pref_func.apply_prep(pn_filter,false);
            pref_func.apply_prep(pn_filter,true); // make obj2.
            filter_kwd_prep(pref.catalog.filter.kwd);
            if (!initialize_loop) catalog_filter_changed();
            catalog_attr_changed();
          }
        },
//        'save_onleave'        : function(){if (pref.catalog.auto_save_filter) onchange_funcs.save();window.removeEventListener('beforeunload', onchange_funcs.save_onleave, false);},
//        'save'                : function(){if (localStorage) localStorage.setItem(onchange_funcs.load_save_key(pref.catalog_board_list_sel),JSON.stringify(pref.catalog.filter));},
        'save'                : function(){
          if (localStorage)
            localStorage.setItem(onchange_funcs.load_save_key(pref.catalog_board_list_sel),
              JSON.stringify(pref_func.obj_elim_the_same(pref_default().catalog.filter, pref.catalog.filter)));
        },
        'load_default'               : function(){
//          var pref_def = pref_default();
          pref_func.pref_overwrite(pref.catalog.filter,pref_default().catalog.filter);
//          pref.catalog.filter.time_str = new Date().toLocaleString();
          pref_func.apply_prep(pn12_0_4,false);
          pref_func.apply_prep(pn12_0_4,true); // obj init.
          filter_kwd_prep(pref.catalog.filter.kwd);
          catalog_filter_changed();
          catalog_attr_changed();
        },
        'load_save_key'       : function(num){return pref.script_prefix + '.catalog.filter.' + pref.catalog_board_list_obj[num][0].key;},
        'catalog.filter.kwd.use'   : catalog_filter_changed,
        'catalog.filter.kwd.str'   : function(){filter_kwd_prep(pref.catalog.filter.kwd);},
        'catalog.filter.kwd.match' : catalog_filter_changed,
        'catalog.filter.kwd.re'    : 'catalog.filter.kwd.str',
        'catalog.filter.kwd.ci'    : 'catalog.filter.kwd.str',
        'catalog.filter.kwd.op'    : catalog_filter_changed,
        'catalog.filter.kwd.post'  : catalog_filter_changed,
        'catalog.filter.kwd.sub'   : catalog_filter_changed,
        'catalog.filter.kwd.name'  : catalog_filter_changed,
        'catalog.filter.kwd.file'  : catalog_filter_changed,
        'catalog.filter.kwd.com'   : catalog_filter_changed,
        'catalog.filter.kwd.trip'  : catalog_filter_changed,
        'catalog.filter.tag'       : catalog_filter_changed,
//        'catalog.filter.tag_list'  : catalog_filter_changed,
        'catalog.filter.time'      : catalog_filter_changed,
        'catalog.filter.time_str'  : function(){if (pref.catalog.filter.time_mark) re_trim_html();catalog_filter_changed();},
        'catalog.filter.list'      : catalog_filter_changed,
        'catalog.filter.list_str'  : catalog_filter_changed,
        'catalog.filter.time_mark'      : re_trim_html,
        'catalog.filter.list_time_mark' : re_trim_html,
        'catalog.filter.watch_list_time_mark' : re_trim_html,
//        'catalog.filter.attr_list' : catalog_filter_changed,
//        'catalog.filter.attr_list_str' : catalog_filter_changed,
//        'catalog.filter.attr_list' : show_catalog, //catalog_attr_changed,
//        'catalog.filter.attr_list_str' : show_catalog, //catalog_attr_changed
        'catalog.filter.attr_list' : catalog_attr_changed,
        'catalog.filter.attr_list_str' : catalog_attr_changed,
        'catalog.filter.tag_filter_str' : liveTag.filter_onchange_entry,
//        'scan'                     : scan_tags,
        'scanSite' : function(){if (pref.catalog.filter.scan_clear_auto) onchange_funcs.clear_threads();scan_boards.keyword_load('scan');},
//        'scanSite' : function(){scan_boards.keyword_load('scan');},
        'catalog.order.reply_to_me' : re_sort_thread,
        'catalog.order.reply'       : re_sort_thread,
        'catalog.order.watch'       : re_sort_thread,
        'catalog.order.sticky'      : re_sort_thread,
//        'catalog.filter.tag_ci'     : function(){scan_tags_init(scan_tags_common_c(site3[site.nickname].tags,'')[0], null);},
      }
      onchange_funcs.entry_func = (function(myself){ // the same as these of pn13, shold prototype be used?
        return function(e){
          pref_func.apply_prep(this,true);
          if (myself[this.name]) myself[this.name](this);
        }
      })(onchange_funcs);
      window.addEventListener('beforeunload', window_beforeunload, false);
      pref_func.add_onchange(pn12_0_2,onchange_funcs); // causes 1 leak.
      pref_func.add_onchange(pn12_0_4,onchange_funcs); // causes 1 leak.
//console.log('init_onchange');
      window.addEventListener('storage', site2[site.nickname].prep_own_posts_event, false);
//      site2[site.nickname].prep_own_posts();
      site2[site.nickname].check_reply.make_own_posts(); // prevent from calling twice.
      function window_beforeunload() {
        if (pref.catalog.auto_save_filter) onchange_funcs.save();
        window.removeEventListener('beforeunload', window_beforeunload, false);
      }
      if (initialize_loop && embed_catalog && pref.virtualBoard.scan)
        setTimeout(function(){scan_boards.keyword_load('scan',true);}, pref.virtualBoard.scanDelay*1000);
      
      var pn_setting = pn12_0_4.childNodes[0];
////      if (!pref.catalog_show_setting) pn_setting.style.display = 'none';
      pn_setting.style.display = 'none';
      var pn_filter = pn12_0_4.childNodes[1];
      var triage_parent = (embed_catalog || embed_page)? site2[site.nickname].catalog_get_native_area() : pn12_1;
      if (pref.catalog.auto_load_filter) onchange_funcs.load();

      var tags_scan_regex = new RegExp('#[^#, \.:;\n]+(?=#|,| |\.|:|;|\n|$)','g'); // ATTENTION. REFER function prep_tag_str(); // AND ALSO IN scan_tag_obj.
      var scan_boards = (function(){
        var scan_button   = pn12_0_4.getElementsByTagName('button')['scanSite'];
        var scan_boards   = {args:{}, crawler_timer:null, pool:null};
        var scan_progress = (function(){
          var elem = pn12_0_4.getElementsByTagName('span')['scan_progress'];
          var timer = null;
          var str = '';
          function show(){elem.innerHTML=str; timer=null;}
          return function(s){str=s; if (timer===null) timer = setTimeout(show,100);};
        })();
        function keyword_load(key){
          if (scan_boards_check_pre(key,true)) {
//            if (pref.catalog.filter.scan_clear_auto && !keep) onchange_funcs.clear_threads();
            scan_button.innerHTML = 'Cancel';
            if (!site3[site.nickname].boards) {
              http_req.get(key,site.nickname,site2[site.nickname].url_boards_json(),scan_boards_keyword_callback,pref.scan.lifetime*60,true,key);
              scan_progress('Loading boards\' information');
            } else {
              var tgts = site2[site.nickname].enumerate_boards_to_scan(); // must remake to evaluate change of preference.
              scan_boards_init(key, tgts, {lifetime:pref.scan.lifetime*60, cache_write:true,
                                           callback:(pref.liveTag.use)? catalog_liveTag_scan_threads : null, callback_args:'scan'});
            }
          }
        }
        function scan_boards_keyword_callback(key,value,scan_key){
          catalog_refresh_boards_callback(key,value);
          if (value.status==200) keyword_load(scan_key);
          else scan_progress('Error at loading board\'s infomation.');
        }
        function scan_boards_check_pre(key,button_cap){
          if (scan_boards.args[key]) {
            if (scan_boards.args[key].max != scan_boards.args[key].idx) scan_boards.args[key].max = scan_boards.args[key].idx;
            else {
              if (scan_boards.args[key].crawler_watchdog) scan_boards.args[key].crawler_watchdog.stop();
              delete scan_boards.args[key];
              if (button_cap) scan_button.innerHTML = 'scanSite';
            }
            return false;
          } else return true;
        }
//        function scan_boards_keyword_init(key){
//          scan_boards_init(key, site3[site.nickname].boards,pref.catalog.filter.tag_scansite,pref.catalog.filter.tag_scansite,pref.scan.lifetime*60);
//          var obj = [];
//          obj.max_threads = pref.scan.max_threads;
//          var count = pref.scan.max;
//          for (var i in site3[site.nickname].boards) if (site3[site.nickname].boards[i].max) {
//            obj.push('/'+site3[site.nickname].boards[i].uri+'/');
//            if (--count==0) break;
//          }
//          scan_boards_init(key, obj, {lifetime:pref.scan.lifetime*60, cache_write:true});
//        }
        function scan_init(key,mem,args){
if (pref.debug_mode['5']) console.log('scan_init: '+key);
          if (!scan_boards_check_pre(key,false)) return;
          var obj = mem;
//          if (!Array.isArray(mem)) {
//            var obj = [];
////            for (var i in mem) obj.push({uri:cnst.name2domainboardthread(i,true)[1].replace(/\//g,'')});
//            for (var i in mem) obj.push(i);
//          }
          if (!Array.isArray(mem)) obj = Object.keys(mem);
          if (obj.length==0) {
            if (args.callback) args.callback(args.callback_args);
            return;
          }
          scan_boards_init(key, obj, args);
        }
        function scan_boards_init(key, obj, args){
          if (!scan_boards.pool) scan_boards.pool = {
            div: document.createElement('div'), parser: new DOMParser(), doc: null, ths: null, dbt: null, tgts: null, tags:{cs:{}, ci:{}},
            name:null, sticky:null, type:null, wrapper_obj:null};
  //        var obj = site3[site.nickname].boards;
          scan_boards.args[key] = {
                key: key,
                idx: 0,
//                max: (obj.length>pref.scan.max)? pref.scan.max : obj.length,
                max: obj.length,
//                max_threads: (obj.length>pref.scan.max)? obj.length : pref.scan.max,
                max_threads: pref.scan.max_threads,
                found_threads: 0,
                found_boards: 0,
                scanned: 0,
                error: '',
                error_obj: {},
                crawler: 0,
                crawler_max : pref.scan.crawler,
                obj: obj,
                force_json: false,
                scan_tag: pref.catalog.filter.tag_scansite,
                store_tag: pref.catalog.filter.tag_scansite,
                lifetime: 0,
                cache_write: false,
                callback : null,
                callback_args : null,
                pool: scan_boards.pool,
                refresh: obj.refresh,
                indicator: null,
                tgt_raw: false,
                watchdog: null,
                spawn_crawler: function(){scan_boards_spawn_crawler(key);},
                crawler_watchdog: null,
                from_auto: null,
                load_on_demand: null,
//                tag_only: null,
          };
          for (var i in args) scan_boards.args[key][i] = args[i];
          var sb = scan_boards.args[key];

          if (sb.crawler_watchdog) sb.crawler_watchdog = new CrawlerWatchdog(sb);
//          while (obj[sb.max-1].max===null) sb.max--;
          if (sb.load_on_demand) {
            if (load_on_demand.get()) sb.callback = (sb.callback)? (function(func_old){return function(){load_on_demand.release();func_old();}})(sb.callback) : load_on_demand.release; // First access may not have mutex.
            sb.max = 1;
            for (var i=obj.length-1;i>=1;i--) {
              var name = 'ODL:'+ sb.obj[i];
              var idx = threads_idx.indexOf(name);
              if (idx!=-1) threads_idx.splice(idx,1);
              threads_idx.unshift(name);
            }
            drawn_idx = 0;
          }
//if (pref.debug_mode['5']) {
//  console.log('scan_boards: '+key+', '+scan_boards.args[key].obj.length);
//  console.log(scan_boards.args[key].obj);
//}
          while (sb.crawler<pref.scan.crawler) {
            scan_boards_spawn_crawler(key, true);
            if (pref.scan.crawler_adaptive) break;
          }
        }
        function scan_boards_spawn_crawler_timer(sb){
          scan_boards_crawler_timer_clear();
          if (sb.crawler<sb.crawler_max) scan_boards.crawler_timer = setTimeout(sb.spawn_crawler, pref.scan.crawler_idle_time_to_spawn);
        }
        function scan_boards_spawn_crawler(key, init){
          var sb = scan_boards.args[key];
if (pref.debug_mode['5']) console.log('crawler_spawn: '+sb.key+', '+(sb.crawler+1));
          scan_boards_keyword([sb.key+sb.crawler++,sb],200);
          if (!init && sb.idx<sb.max) scan_boards_spawn_crawler_timer(sb);
        }
//        function scan_boards_spawn_crawler(sb){ // working code.
//          scan_boards_keyword([sb.key+sb.crawler++,sb],200);
//  //console.log('spawn '+sb.crawler);
//        }
        function scan_boards_crawler_timer_clear(){
          if (scan_boards.crawler_timer!==null) {
            clearTimeout(scan_boards.crawler_timer);
            scan_boards.crawler_timer=null;
          }
        }
        var CrawlerWatchdog = function(sb){ // patch for 8chan's unstability.
          this.sb = sb;
          this.tgt = 0;
          this.db = new DelayBuffer(this.respawn.bind(this), 30000);
          this.db.delayed_do();
        }
        CrawlerWatchdog.prototype = {
          report_alive: function(kwd){
            if (!this.sb) return; // stopped already
            var me = kwd.substr(this.sb.key.length);
            if (this.tgt==me) {
              this.tgt = (this.tgt<this.sb.crawler-1)? this.tgt+1 : 0;
              this.db.cancel();
              this.db.delayed_do();
            }
          },
          respawn: function(){
            if (this.sb.idx<this.sb.max) {
              if (pref.debug_mode['7']) console.log('crawler_respawn: '+this.sb.key+this.tgt+'/'+this.sb.crawler);
              scan_boards_keyword([this.sb.key+this.tgt,this.sb],200);
              this.report_alive(this.sb.key+this.tgt);
            } else {
              if (pref.debug_mode['7']) console.log('crawler_respawn: '+this.sb.key+this.tgt+'/'+this.sb.crawler+', stopped.');
              this.stop();
            }
          },
          stop: function(){
            this.db.cancel();
            this.sb = null; // release pointer
          }
        }
        function scan_boards_keyword(args,status){
          var sender = args[0];
          var sb = args[1];
          if (sb.crawler_watchdog) sb.crawler_watchdog.report_alive(sender);
//if (pref.debug_mode['5']) console.log('request_entry: '+sb.idx+'/'+sb.max+', '+sb.found_threads+'/'+sb.max_threads+', '+status);
if (pref.debug_mode['5'] && sb.idx!=0 && sb.idx%1000==0) console.log('request_progress: '+sb.key+', '+sb.idx+'/'+sb.max+', '+sb.found_threads+'/'+sb.max_threads+', '+status);
          if (sb.idx<sb.max && (sb.refresh || sb.found_threads<sb.max_threads) && status<500) {
            if (sb.watchdog) sb.watchdog();
            var tgt = (typeof(sb.obj[sb.idx])==='string')? sb.obj[sb.idx] : sb.obj[sb.idx].key;
            var dbt = cnst.name2domainboardthread(tgt,true);
////            var tgt = (sb.tgt_raw)? sb.obj[sb.idx] // working code.
////                    : (dbt[2]==='')? (sb.obj[sb.idx] + ((pref.catalog.catalog_json | sb.force_json)? 'j0' : 'c0'))
////                                   :                   ((pref.catalog.catalog_json && dbt[2][0].search(/[0-9]/)!=-1)? dbt[0]+dbt[1]+'t'+dbt[2] : sb.obj[sb.idx]);
            tgt = (sb.tgt_raw)? tgt
                : (dbt[2]==='')? (tgt + ((pref.catalog.catalog_json | sb.force_json)? 'j0' : 'c0'))
                               :        ((pref.catalog.catalog_json && dbt[2][0].search(/[0-9]/)!=-1)? dbt[0]+dbt[1]+'t'+dbt[2] : tgt);
            sb.idx++;
            scan_progress(sb.found_threads+'/'+sb.scanned+', '+sb.found_boards+'/'+sb.idx+'/'+sb.max+', ' + tgt);
            if (!pref.catalog.board.ex_list || !pref_func.merge_obj5(tgt,pref.catalog.board.ex_list_obj2,{hit:false}).hit) {
              liveTag.list_nup.issued(sb.obj[sb.idx-1]);
              http_req.get(sender,tgt,'',scan_boards_keyword_callback2,sb.lifetime,sb.cache_write,args); 
              if (sb.idx<sb.max && pref.scan.crawler_adaptive) scan_boards_spawn_crawler_timer(sb);
            } else scan_boards_keyword(sender,200);
          } else {
            http_req.close(sender);
if (pref.debug_mode['5']) console.log('crawler_finish: '+sb.key+', '+(sb.crawler-1));
            if (--sb.crawler==0) {
              if (sb.crawler_watchdog) sb.crawler_watchdog.stop();
              scan_progress(sb.found_threads+'/'+sb.scanned+', '+sb.found_boards+'/'+sb.max
                            + '<span style="color:red">'
                            +( (sb.error!=='')? ', Error at loading '+sb.error :
                              ((!sb.refresh && sb.found_threads>=sb.max_threads)? ', Aborted.(Reached upper limit)' : ''))
                            + '</span>');
//              sb.max = sb.idx;
              scan_button.innerHTML = 'scanSite';
              if (sb.store_tag) {
  //console.log(new Date());
  //              scan_tags_init(sb.pool.tags);
                var ret_obj = scan_tags_common_b(sb.pool.tags,'',site3[site.nickname].tags);
                site3[site.nickname].tags = ret_obj[1];
                scan_tags_init(ret_obj[0],true);
  //              sb.pool.div.innerHTML = '';
  //console.log(new Date());
              }
//              sb = null;
              if (sb.indicator) {
                var keys = Object.keys(sb.error_obj);
                if (keys.length==0) health_indicator.set(sb.indicator,null,'\u25cf');
                else if (keys.length>=sb.max) health_indicator.set(sb.indicator,'red','X')
                else health_indicator.set(sb.indicator,null,'\u25b2');
              }
              delete scan_boards.args[sb.key];
if (pref.debug_mode['5']) console.log('scan_boards_end: '+sb.key+', Running:'+Object.keys(scan_boards.args));
              if (Object.keys(scan_boards.args).length==0) scan_boards.pool = null;
              if (sb.callback) sb.callback(sb.callback_args);
            }
          }
        }

        function scan_boards_keyword_callback2(key,value,args){ // requires snoop and on demand rendering for merge.
          if (pref.scan.crawler_adaptive) scan_boards_crawler_timer_clear();
          var sb = args[1];
          sb.pool.dbt = key.split(',');
          var dbt = sb.pool.dbt;
          if (value.status==200 && value.response===null) { // patch for 8chan's inconsistency.
            console.log('ERROR!!! Inconsistency in server. Server returned null with status 200 for '+site2[dbt[0]].make_url4(dbt)[0]+' , '+key);
            value.status=1200;
          }
          if (value.status==200 && sb.found_threads<sb.max_threads) {
            sb.pool.tgts = {};
            var tgts = sb.pool.tgts;
            sb.pool.ths = site2[dbt[0]].wrap_to_parse.get(value.response, dbt[0], dbt[1], dbt[3], (dbt[3]==='thread_html' || dbt[3]==='thread_json')? {thread:dbt[2]} : {page:dbt[2]});
            var ths = sb.pool.ths;
            sb.scanned += ths.length;
if (pref.test_mode['22']) {
            var tgt_pn = sb.pool.div;
            var from_catalog = dbt[3]==='catalog_json' || dbt[3]==='catalog_html';
            var filter_active = (pref.catalog.filter.kwd.use && pref.catalog.filter.kwd.str!=='') || (pref.catalog.filter.tag && filter_tags.length!=0);
} else {
            var filter_active = (pref.catalog.filter.kwd.use && pref.catalog.filter.kwd.str!=='') || (pref.catalog.filter.tag && pref.liveTag.use && liveTag.active.in);
}
////            var from_json = dbt[3].indexOf('_json')!=-1;
            for (var i=0;i<ths.length;i++) {
if (pref.test_mode['22']) {
              if (sb.scan_tag && from_catalog) {
                if (ths[i].type_data==='json') tgt_pn.innerHTML = ths[i].name + '\n' + ths[i].sub + '\n' + ths[i].com;
                else tgt_pn = ths[i].pn;
                ths[i].tags = tgt_pn[brwsr.innerText].match(tags_scan_regex);
              }
} else {
//var tmp_len = Object.keys(liveTag.list_nup).length;
//if (tmp_len!=0 && tmp_len%100===0) console.log('len: '+tmp_len);
////////              if (pref.liveTag.use) {
              ths[i].tags = liveTag.prep_tags(ths[i]); // extract tags in op.
              if (ths[i].tags.q) site2[ths[i].domain].popups_fetched(ths[i]);
              var watch = ths[i].tags[2];
              var flag_update = (pref.liveTag.from==='post' || watch[0]!==0)? false : null;
              if (watch[10]<ths[i].nof_posts || watch[3]<0) { // watch[3]<0 is a patch for retag.
//if (ths[i].parse_funcs.has_posts && ths[i].last_replies) console.log(ths[i].key+', '+ths[i].last_replies.length+', '+ths[i].nof_posts+', '+watch[10]);
//                if (pref.debug_mode.unread_count===ths[i].key) console.log('uc: watch[10]='+watch[10]+', nof_posts='+ths[i].nof_posts);
                if (ths[i].type_source==='thread' ||
                  (ths[i].parse_funcs.has_posts && ths[i].last_replies && ths[i].last_replies.length>=ths[i].nof_posts-watch[10])) {
                    flag_update = update_thread(dbt[0]+dbt[1]+ths[i].no, ths[i], watch);
                    if (flag_update) tgts[ths[i].key] = true;
                    liveTag.list_nup.got_200(ths[i].key);
//                    if (pref.debug_mode['3']) console.log('Check tags: '+ths[i].key+', '+watch[10]);
                    if (threads[ths[i].key]) insert_footer3(ths[i].key,ths[i].flags,ths[i].page,(flag_update==='t')? ths[i].tags : null, ths[i]);
                } else if (!(ths[i].parse_funcs.has_posts && !ths[i].last_replies)) {
                  liveTag.list_nup.add(ths[i].key); // patch for 8chan. 8chan has an inconsistensy between catalog and threads,
                                                    // some threads are there in catalog, but returns 404 if it gets as a thread.
                                                    // However, 8chan doesn't return 404, but fails at send(null), so system like watchdog is required.
//                  if (pref.debug_mode['3']) console.log('Schedule to check tags: '+ths[i].key+', '+watch[10]);
                }
              } else {
                if (watch[10]>ths[i].nof_posts) watch[10] = ths[i].nof_posts; // works when posts are deleted.
                if (threads[ths[i].key]) insert_footer3(ths[i].key,null,ths[i].page);
                liveTag.list_nup.got_200(ths[i].key); // may redundant???
              }

////////              }
}
              var pick_up_by_filter = filter_active && catalog_filter_query_scan(ths[i].posts, ths[i].tags);
              if (!sb.tag_only && (sb.refresh || (flag_update && threads[ths[i].key]) || pick_up_by_filter)) {
//              if (!sb.tag_only && (sb.refresh || (filter_active && catalog_filter_query_scan(ths[i].posts, ths[i].tags)))) {
                var new_thread = threads[ths[i].key]===undefined;
                var appear_thread = threads[ths[i].key] && !threads[ths[i].key][9][0];
////////                if (insert_thread_with_test(ths[i], dbt[3], value.date)) {// RUNS A REDUNDANT POST CHECK AT FIRST TIME....
                if (flag_update || pick_up_by_filter || new_thread) insert_thread_passed_test(ths[i], dbt[3], value.date);
                else if (flag_update===null) flag_update = insert_thread_with_test(ths[i], dbt[3], value.date); // RUNS A REDUNDANT POST CHECK AT FIRST TIME....
                if (flag_update || pick_up_by_filter || new_thread) tgts[ths[i].key] = true;
                else if (pref.catalog_load_on_demand) reorder_thread_idx(ths[i].key);
                sb.found_threads++;
                appear_thread &= threads[ths[i].key] && threads[ths[i].key][9][0];
                if (sb.from_auto && (new_thread || appear_thread)) notifier.appeared(ths[i],new_thread);
              }
            }
if (pref.test_mode['22']) {
            if (sb.scan_tag && from_catalog) tag_scan_board(ths, sb);
}
            if (dbt[3]==='catalog_json' || dbt[3]==='catalog_html') {
              if (pref.liveTag.use) liveTag.list_nup.add_board(dbt[0]+dbt[1], value.date);
              rm_items_404_check(dbt[0],dbt[1],ths);
            }
            if (Object.keys(tgts).length!=0) {
              sb.found_boards++;
              show_catalog(tgts);
  //          if (pref.catalog.filter.tag_scan_auto) scan_tags();
            }
////////            if ((dbt[3]==='thread_html' || dbt[3]==='thread_json') && threads[ths[0].key]) update_thread(dbt[0]+dbt[1]+dbt[2], ths[0], threads[ths[0].key][19]); // patch  // working code.
//            if ((dbt[3]==='thread_html' || dbt[3]==='thread_json') && threads[ths[0].key] && threads[ths[0].key][23]) update_thread(dbt[0]+dbt[1]+dbt[2], ths[0], threads[ths[0].key][19]); // patch to delete threads[name][23]
////            if (dbt[3]==='thread_html') {
////              var name = dbt[0] + dbt[1] + dbt[2];
////              if (threads[name]) { // patch for parallel entry.
////                site2[dbt[0]].check_reply.do(value.response, dbt, threads[name][19], threads[name][8], dbt[3]); // SHOULD CONSOLIDATE TO CHECK_REPLY.CHECK().
////
//////                if (threads[name][20]!==sb.pool.sticky) { // working code.
//////                  site2[dbt[0]].add_sticky_info(threads[name][0],threads[name][18],sb.pool.sticky);
//////                  threads[name][20] = sb.pool.sticky;
//////                }
////                if (threads[name][23]) {
////                  threads[name][23] = false;
////                  threads[name][9] = catalog_filter_query(name);
////                }
//////                if (pref.catalog_footer_show_nof_rep) site2[dbt[0]].insert_footer2(threads[name][0],threads[name][18],threads[name][19],threads[name][8]);
////                if (pref.catalog_footer_show_nof_rep) insert_footer3(threads[name][24],threads[name][19],threads[name][8],name);
////                threads[name][21] = false;
////                if (threads[name][19][0]>=0) notifier.changed(name,threads);
////                threads[name][19][5] = false;
////                threads[name][19][4] = null; // for GC.
////                reorder_thread_idx(name);
//////var debug = '';
//////for (var d=0;d<10;d++) debug += threads_idx[d] + ', ';
//////console.log('ddd :'+debug);
//////              if (reorder_thread_idx(name)) {
//////                tgts = {};
//////                tgts[name] = true;
//////                show_catalog(tgts);
//////              }
////              }
////            }
          } else {
            if (value.status==404 && (dbt[3]==='thread_json' || dbt[3]==='thread_html') && threads[dbt[0]+dbt[1]+dbt[2]]) {
              remove_thread(dbt[0] + dbt[1] + dbt[2]);
              if (pref.liveTag.use) liveTag.remove_tags_in_th(dbt);
              liveTag.list_nup.got_404(dbt[0] + dbt[1] + dbt[2]);
            }
            if (sb.found_threads<sb.max_threads) {
              sb.error += ((sb.error==='')? '' : ', ') + key;
              sb.error_obj[key] = value.status;
              if (value.status==404) comment_out_bookmark(key);
              if (sb.indicator) health_indicator.set(sb.indicator,'orange');
            }
          }
          scan_boards_keyword(args,value.status);
        }
  
////        function tag_scan_extract_1(pn) { // working code.
////          return pn[brwsr.innerText].match(tags_scan_regex);
////        }
        function tag_scan_board(ths, sb) { // patch
          var ths_tag = {};
          for (var i=0;i<ths.length;i++) ths_tag[ths[i].key] = ths[i];
          scan_tags_common(ths_tag,'',sb.pool.tags);
        }

////        function tag_scan_extract_1(key,pn,sb) {
////          pn.tags = pn[brwsr.innerText].match(tags_scan_regex);
////          var ths = {};
////          ths[key] = pn;
////          scan_tags_common(ths,'',sb.pool.tags);
////  //        scan_tags_common({key:pn},'',sb.pool.tags,true);
////  //        return pn.tags;
////        }

////////        function scan_boards_keyword_callback2(key,value,args){
////////          var sb = args[1];
////////          if (pref.scan.crawler_adaptive) scan_boards_crawler_timer_clear();
////////          sb.pool.dbt = cnst.name2domainboardthread(key,true);
////////          if (value.status==200 && sb.found_threads<sb.max_threads) {
////////            if (sb.pool.dbt[2]=='j0' || sb.pool.dbt[2]=='c0') {
////////              if (sb.pool.dbt[2]=='j0') {
////////                sb.pool.type = 'catalog_json';
////////                sb.pool.doc = ('response' in value)? value.response : JSON.parse(value.responseText);
////////                var obj = sb.pool.doc;
//////////                var obj = ('response' in value)? value.response : JSON.parse(value.responseText);
////////    //            if (sb.scan_tag) {
////////    //              for (var i=0;i<obj.length;i++) {
////////    //                for (var j=0;j<obj[i].threads.length;j++) {
////////    //                  sb.pool.div.innerHTML = obj[i].threads[j].com;
////////    //                  obj[i].threads[j].tags = tag_scan_extract_1(sb.pool.dbt[0]+sb.pool.dbt[1]+obj[i].threads[j].no,sb.pool.div,sb);
////////    //                }
////////    //            }}
////////                for (var i=0;i<obj.length;i++) {
////////                  if (obj[i].threads) {
////////                    sb.scanned += obj[i].threads.length;
////////                    for (var j=0;j<obj[i].threads.length;j++) {
////////                      sb.name = sb.pool.dbt[0]+sb.pool.dbt[1]+obj[i].threads[j].no;
//////////                      if (threads[sb.name] && threads[sb.name][20]!==obj[i].threads[j].sticky) { // working code.
//////////                        site2[sb.pool.dbt[0]].add_sticky_info(threads[sb.name][0],threads[sb.name][18],obj[i].threads[j].sticky);
//////////                        threads[sb.name][20] = obj[i].threads[j].sticky;
////////////                        reorder_thread_idx(sb.pool.dbt[0] + sb.pool.dbt[1] +sb.pool.dbt[2].substr(1)); doesn't prepared threads[];
//////////                      }
////////                      if (sb.scan_tag) {
////////                        sb.pool.div.innerHTML = obj[i].threads[j].com + '\n' + obj[i].threads[j].sub + '\n' + obj[i].threads[j].name;
////////                        tag_scan_extract_1(sb.pool.dbt[0]+sb.pool.dbt[1]+obj[i].threads[j].no,sb.pool.div,sb);
////////                      }
//////////                      var search_obj = [obj[i].threads[j].com, obj[i].threads[j].sub, obj[i].threads[j].name,'','','','',''];
//////////                      if (!catalog_filter_query_scan(search_obj,sb.pool.div.tags)) {obj[i].threads.splice(j,1);j--;}
////////                      if (!catalog_filter_query_scan(obj[i].threads[j],sb.pool.div.tags)) {obj[i].threads.splice(j,1);j--;}
////////                    }
////////                  }
////////                }
////////    //            for (var i=0;i<obj.length;i++) sb.scanned += obj[i].threads.length; // NOT SO FAST.
////////    //            var kwd = pref.catalog.filter.kwd.str;
////////    //            if (pref.catalog.filter.kwd && kwd!=='') {
////////    //              if (!pref.catalog.filter.kwd.re) kwd = kwd.replace(/\*/g,'.*');
////////    //              if (pref.catalog.filter.kwd.ci) kwd = new RegExp(kwd,'i');
////////    //              for (var i=0;i<obj.length;i++) {
////////    //                for (var j=obj[i].threads.length-1;j>=0;j--) {
////////    //                  var str = obj[i].threads[j].name + '\n' + obj[i].threads[j].sub + '\n' + obj[i].threads[j].com;
////////    //                  var result = (str.search(kwd)!=-1);
////////    //                  if (pref.catalog.filter.kwd.match==='unmatch') result = !result;
////////    //                  if (!result) obj[i].threads.splice(j,1);
////////    //                }
////////    //              }
////////    //            }
////////                if ((pref.catalog.filter.kwd.use && pref.catalog.filter.kwd.str!=='') || (pref.catalog.filter.tag && filter_tags.length!=0))
////////                  sb.pool.ths = site2[sb.pool.dbt[0]].catalog_from_json3(obj,sb.pool.dbt[1]); // heavy, and cause loading in chrome.
////////                else sb.pool.ths = [];
////////              } else {
////////                sb.pool.type = 'catalog_html';
////////                sb.pool.doc = ('response' in value)? value.response : sb.pool.parser.parseFromString(value.responseText, 'text/html');
////////                sb.pool.ths = site2[sb.pool.dbt[0]].catalog_from_native(value.date,sb.pool.doc,sb.pool.dbt[1],sb.pool.type);
////////    //            if (sb.scan_tag) for (var i=0;i<sb.pool.ths.length;i++) sb.pool.ths[i].tags = tag_scan_extract_1(sb.pool.dbt[0]+sb.pool.dbt[1]+sb.pool.ths[i].no,sb.pool.ths[i].pn,sb);
////////                sb.scanned += sb.pool.ths.length;
////////                for (var i=0;i<sb.pool.ths.length;i++) {
////////                  if (sb.scan_tag) tag_scan_extract_1(sb.pool.dbt[0]+sb.pool.dbt[1]+sb.pool.ths[i].no,sb.pool.ths[i].pn,sb);
////////                  if (!catalog_filter_query_scan(sb.pool.ths[i],sb.pool.ths[i].pn.tags)) {sb.pool.ths.splice(i,1);i--;}
////////                }
////////              }         
////////              if (sb.pool.ths.length!=0 && ((pref.catalog.filter.kwd.use && pref.catalog.filter.kwd.str!=='') || (pref.catalog.filter.tag && filter_tags.length!=0))) {
////////                sb.found_boards++;
////////                sb.found_threads += sb.pool.ths.length;
////////                sb.pool.tgts = {};
////////                for (var i=0;i<sb.pool.ths.length;i++) {
////////                  insert_thread_with_test(sb.pool.ths[i], sb.pool.type, value.date); // patch
//////////                  insert_thread_from_native(sb.pool.ths[i], sb.pool.dbt[0], sb.pool.dbt[1], false, value.date);
////////                  sb.pool.tgts[sb.pool.dbt[0]+sb.pool.dbt[1]+sb.pool.ths[i].no] = true;
////////                }
////////                show_catalog(sb.pool.tgts);
////////    //            if (pref.catalog.filter.tag_scan_auto) scan_tags();
////////              }
////////            } else {
////////              var name = sb.pool.dbt[0] + sb.pool.dbt[1] + ((sb.pool.dbt[2][0]==='t')? sb.pool.dbt[2].substr(1) : sb.pool.dbt[2]);
////////              if (threads[name]) { // patch for parallel entry.
////////                sb.pool.type = (sb.pool.dbt[2][0]!=='t')? 'thread_html' : 'thread_json';
////////                if (sb.pool.dbt[2][0]!=='t') sb.pool.doc = ('response' in value)? value.response : sb.pool.parser.parseFromString(value.responseText, 'text/html');
//////////                site2[sb.pool.dbt[0]].check_reply_to_me(name,sb.pool.dbt,threads[name][19],(sb.pool.dbt[2][0]!=='t')? sb.pool.doc : value);
//////////var time_0 = performance.now();
//////////                site2[sb.pool.dbt[0]].check_reply_to_me(name,sb.pool.dbt,threads[name][19],(sb.pool.dbt[2][0]!=='t')? sb.pool.doc : value,threads[name][8], sb.pool, sb.pool.type); // also checks sage.
//////////                site2[sb.pool.dbt[0]].check_reply_to_me(name,sb.pool.dbt,threads[name][19],(sb.pool.dbt[2][0]!=='t')? sb.pool.doc : value.response, threads[name][8], sb.pool, sb.pool.type); // also checks sage.
////////                site2[sb.pool.dbt[0]].check_reply.do((sb.pool.dbt[2][0]!=='t')? sb.pool.doc : value.response, sb.pool.dbt, threads[name][19], threads[name][8], sb.pool.type);
////////
//////////                if (threads[name][19][0]>threads[name][8][4]) threads[name][19][0] = -1; // 2015.05.01 removed, but I don't remember why I wrote this.
////////
//////////console.log('check_reply :'+name+', '+(performance.now()-time_0));
//////////                if (threads[name][20]!==sb.pool.sticky) { // working code.
//////////                  site2[sb.pool.dbt[0]].add_sticky_info(threads[name][0],threads[name][18],sb.pool.sticky);
//////////                  threads[name][20] = sb.pool.sticky;
//////////                }
////////                if (threads[name][23]) {
////////                  threads[name][23] = false;
////////                  threads[name][9] = catalog_filter_query(name);
////////                }
//////////                if (pref.catalog_footer_show_nof_rep) site2[sb.pool.dbt[0]].insert_footer2(threads[name][0],threads[name][18],threads[name][19],threads[name][8]);
////////                if (pref.catalog_footer_show_nof_rep) insert_footer3(threads[name][24],threads[name][19],threads[name][8],name);
////////                threads[name][21] = false;
////////                if (threads[name][19][0]>=0) notifier.changed(name,threads);
////////                threads[name][19][5] = false;
////////                threads[name][19][4] = null; // for GC.
////////                reorder_thread_idx(name);
//////////var debug = '';
//////////for (var d=0;d<10;d++) debug += threads_idx[d] + ', ';
//////////console.log('ddd :'+debug);
//////////              if (reorder_thread_idx(name)) {
//////////                sb.pool.tgts = {};
//////////                sb.pool.tgts[name] = true;
//////////                show_catalog(sb.pool.tgts);
//////////              }
////////              }
////////            }
////////          } else {
////////            if (value.status==404 && (sb.pool.dbt[2][0]=='t' || sb.pool.dbt[2].search(/^[0-9]/)!=-1)) {
////////              var name = sb.pool.dbt[0] + sb.pool.dbt[1] + ((sb.pool.dbt[2][0]==='t')? sb.pool.dbt[2].substr(1) : sb.pool.dbt[2]);
////////              remove_thread(name);
////////            }
////////            if (sb.found_threads<sb.max_threads) sb.error += ((sb.error==='')? '' : ', ') + key;
////////          }
////////          sb.pool.doc = null;
////////          scan_boards_keyword(args,value.status);
////////        }
////////  
////////        function tag_scan_extract_1(key,pn,sb) {
////////  //        sb.pool.tags[key] = {};
////////  //        var tags = pn[brwsr.innerText].match(tags_scan_regex);
////////  //        sb.pool.tags[key].tags = tags;
////////  ////        var tags = div[brwsr.innerText].match(tags_scan_regex);
////////  ////        if (tags) {
////////  ////          var tags_uniq = {};
////////  ////          for (var k=0;k<tags.length;k++) tags_uniq[tags[k]] = 1;
////////  ////          for (var k in tags_uniq) {
////////  ////            if (sb.pool.tags[k]===undefined) sb.pool.tags[k] = [];
////////  ////            sb.pool.tags[k].push(key);
////////  ////          }
////////  ////        }
////////  //        return tags;
////////          pn.tags = pn[brwsr.innerText].match(tags_scan_regex);
////////          var ths = {};
////////          ths[key] = pn;
////////          scan_tags_common(ths,'',sb.pool.tags);
////////  //        scan_tags_common({key:pn},'',sb.pool.tags,true);
////////  //        return pn.tags;
////////        }
        cataLog.scan_init = scan_init;
        return {
          keyword_load: keyword_load,
          scan_init: scan_init,
//          update_thread: update_thread,
        }
      }());
      cataLog.scan_boards = scan_boards;

      function catalog_resized(myself) {
        var tgt;
        if ((pref.catalog.text_mode.mode==='graphic' && (myself.name==='catalog_size_text_width' || myself.name==='catalog_size_text_height')) ||
            (pref.catalog.text_mode.mode==='text'    && (myself.name==='catalog_size_width'      || myself.name==='catalog_size_height'))) return;
        else tgt = myself.name.substr(myself.name.lastIndexOf('_')+1);
        var val = (pref[myself.name]==0)? '' : pref[myself.name] + 'px';
        for (var i in threads) threads[i][0].style[tgt] = val;
//        for (var i in threads) {
//          threads[i][0].style.width  = (pref.catalog_size_width==0 )? '' : pref.catalog_size_width  + 'px';
//          threads[i][0].style.height = (pref.catalog_size_height==0)? '' : pref.catalog_size_height + 'px';
//        }
      }
      var auto_update = (function(){
        var timer = null;
        var time_remains = 0;
        var indicator = null;
        var timer_tgt = function(from_refresh_button){
          timer=null;
          catalog_refresh(true,null,!from_refresh_button,indicator);
          indicator = null;
          auto_update.set();
        }
        function stop_if_running(){
          if (timer) {clearTimeout(timer); timer=null;}
          if (indicator) health_indicator.remove(indicator);
          indicator = null;
        }
        function countdown(){
          indicator.innerHTML = --time_remains;
          if (time_remains<=0) timer_tgt();
          else timer = setTimeout(countdown,1000);
        }
        return {
          set : function(){
            stop_if_running();
            if (pref.catalog_auto_update) {
              var period = pref.catalog_auto_update_period || 0.5;
              if (!indicator) indicator =  health_indicator.shift('limegreen','');
              if (!pref.catalog_auto_update_countdown) timer = setTimeout(timer_tgt,period*60000);
              else {
                time_remains = period*60;
                countdown();
              }
            }
          },
          stop_if_running: stop_if_running,
          timer_tgt : function(){
            if (timer) {clearTimeout(timer); timer=null;}
            timer_tgt(true);
          }
        }
      })();
      auto_update.set();
//      var auto_update_timer = null; // working code.
//      function set_auto_update(){
//        if (auto_update_timer) {clearTimeout(auto_update_timer);auto_update_timer=null;}
//        if (pref.catalog_auto_update) {
//          var period = pref.catalog_auto_update_period;
//          auto_update_timer=setTimeout(function(){auto_update_timer=null;catalog_refresh(true,null,true);},period*60000);
//        }
//      }
//      set_auto_update();

      pn_filter.getElementsByTagName('*')['catalog.filter.tag_filter_str'].onkeyup = function(){
        pref_func.apply_prep(this,true);
        liveTag.filter_onchange();
      }
////      if (!pref.catalog.filter.show) pn_filter.style.display = 'none';
      pn_filter.style.display = 'none';
      pn_filter.getElementsByTagName('*')['catalog.filter.kwd.str'].onkeyup = function(){
        pref_func.apply_prep(this,true,true);
        if ((!pref.catalog.filter.kwd.use && this.value!=='') || (pref.catalog.filter.kwd.use && this.value==='')) {
          pref.catalog.filter.kwd.use = !pref.catalog.filter.kwd.use;
          var use = pn_filter.getElementsByTagName('*')['catalog.filter.kwd.use'];
          pref_func.apply_prep(use,false,true);
        }
      }
      var filter_time_str = pn_filter.getElementsByTagName('*')['catalog.filter.time_str'];
//      pn_filter.getElementsByTagName('button')['now'].onclick = function(){set_time_str(Date.now());}
      var filter_time_ago_str = pn_filter.getElementsByTagName('*')['catalog.filter.time_ago_str'];
      filter_time_ago_str.onkeyup = ago_clicked;
      pn_filter.getElementsByTagName('button')['ago'].onclick= ago_clicked;
      function ago_clicked(){
        var str = filter_time_ago_str.value;
        var time = Date.now() - (parseInt(str.replace(/:.*/,''),10)*60+parseInt(str.replace(/[^:]*:/,''),10))*60000;
        filter_time_str.value = new Date(time).toLocaleString();
        pref_func.apply_prep(filter_time_str,true,true);
      }
//      function ago_clicked(){
//        var str = filter_time_ago_str.value;
//        var time = Date.now() - (parseInt(str.replace(/:.*/,''),10)*60+parseInt(str.replace(/[^:]*:/,''),10))*60000;
//        set_time_str(time);
//      }
//      function set_time_str(time){
//        filter_time_str.value = new Date(time).toLocaleString();
//        pn_filter_changed();
//      };
//      pn_filter.getElementsByTagName('button')['copy'].onclick =
//        function(){
//          pn_filter.getElementsByTagName('textarea')['catalog.filter.time_mark_str'].value=filter_time_str.value;
//          pn_filter_changed();
//        }
      var watch_list = pn_filter.getElementsByTagName('textarea')['catalog.filter.watch_list_str'];
      var search_ex_list = pn_filter.getElementsByTagName('textarea')['catalog.filter.list_str'];
      search_ex_list.onkeyup = pn_filter_changed;
      var attr_list = pn_filter.getElementsByTagName('textarea')['catalog.filter.attr_list_str'];
      attr_list.onkeyup = function(){if (pref.catalog.filter.attr_list) catalog_attr_changed();};
//      pn_filter.onchange = pn_filter_changed;
      function pn_filter_changed(){
        pref_func.apply_prep(pn_filter,true);
        catalog_filter_changed();
      }
      if (embed_frame) site2[site.nickname].catalog_frame_prep(pn12);
      else if (pref.catalog.appearance.initial.state==='maximized') pn12_0.childNodes[1].childNodes[3].onclick();
      else if (pref.catalog.appearance.initial.state==='top') pn12_0.childNodes[1].childNodes[0].onclick();
      else if (pref.catalog.appearance.initial.state==='bottom') pn12_0.childNodes[1].childNodes[1].onclick();


////      function scan_tags(){ // working code.
////        var ths = [];
////        var j=0;
////        for (var i in threads) {
////          ths[j] = {};
////          ths[j++].tags = threads[i][0][brwsr.innerText].match(tags_scan_regex); // ATTENTION. DESCRIPTION IS ALSO EXIST IN CATALOG_FILTER_QUERY().
////        }
////        var str2 = scan_tags_common(ths,'');
////        scan_tags_init(str2,false);
////      }
      function scan_tags_init(str2, reload){
if (pref.test_mode['22']) {
        var pn_tag_list = pn_filter.getElementsByTagName('div')['catalog.filter.tag_list'];
        if (reload!==null) pn_tag_list.onchange = function(){prep_tag_str(null, reload, true);};
        pn_tag_list.innerHTML = str2;
        if (pn_tag_list.style.height=='') pn_tag_list.style.height = '30px';
        if (pn_tag_list.style.width=='') pn_tag_list.style.width = '100px';
//        prep_tag_str(true,reload);
        prep_tag_str(true,false);
}
      }
      var filter_tags = [];
      function prep_tag_str(keep,reload, from_onchange){
        var pn_tag_list = pn_filter.getElementsByTagName('div')['catalog.filter.tag_list'];
        var cbxes = pn_tag_list.getElementsByTagName('input');
        if (keep===true) {
          for (var i=0;i<filter_tags.length;i++) filter_tags[i] = filter_tags[i].toString().replace(/^\//,'').replace(/\(.*\n*.*/,'');
          var tags = [];
          for (var i=0;i<cbxes.length;i++) tags[i] = cbxes[i].nextSibling.textContent.replace(/ [0-9]*: /,'');
          for (var i=0;i<filter_tags.length;i++)
            for (var j=0;j<cbxes.length;j++)
              if (tags[j]==filter_tags[i]) cbxes[j].checked = true;
        }
        filter_tags = [];
        var tgts = {};
        var flag = false;
        for (var i=0;i<cbxes.length;i++)
          if (cbxes[i].checked) {
            filter_tags.push(new RegExp(cbxes[i].nextSibling.textContent.replace(/ [0-9]*: /,'').replace(/$/,'(#|,| |\\.|:|;|\n|$)'),(pref.catalog.filter.tag_ci)? 'i' : '')); // ATTENTION. REFER tag_scan_regex.
            if (reload) {
              var tags_tgt = (pref.catalog.filter.tag_ci)? site3[site.nickname].tags.ci[i].mem : site3[site.nickname].tags.cs[i].mem;
              for (var j in tags_tgt) tgts[j] = null;
            }
            flag = true;
          }
        if (from_onchange && flag) {
          pref.catalog.filter.tag = true;
          pref_func.apply_prep(pn12_0_4.getElementsByTagName('input')['catalog.filter.tag'],false);
        }
        if (pref.catalog.filter.tag) catalog_filter_changed();
//        pn_filter_changed();
        if (reload) {
//          for (var i in tgts) console.log(i);

//          load_list.tag.tgts = []; // working code.
//          for (var i in tgts) load_list.tag.tgts.push(i+'c0');
////          load_list.tag.use_cache = !refresh;
//          load_list.tag.idx = 0;
//          load_list.tag.mutex = true;
//          load_list.tag.from_auto = false;
//          load_list.tag.tgts = trim_list(load_list.tag.tgts,false);
//          if (pref.catalog_refresh_clear) catalog_clear_threads(pref.catalog.max_threads_at_refresh);
//          if (load_list.tag.idx<load_list.tag.tgts.length) get_page(load_list.tag);
          scan_boards.scan_init('refresh_tag',tgts, {lifetime:pref.scan.lifetime*60, cache_write:true});
//          set_auto_update();
          filter_tags_refresh_mem = tgts;
        }
      }
//      function load_save_key(){
//        return pref.script_prefix + '.catalog.adv_str.' + pref.catalog_board_list_obj[board_sel.selectedIndex][0].key;
//      }
//      pn_filter.getElementsByTagName('button')['load_adv_str'].onclick = function(){
//        if (localStorage) {
//          var tmp = JSON.parse(localStorage.getItem(load_save_key()));
//          if (tmp) {
//            search_ex_list.value = tmp[0];
//            attr_list.value = tmp[1];
//          }
//        }
//      };
//      pn_filter.getElementsByTagName('button')['save_adv_str'].onclick = function(){if (localStorage) localStorage.setItem(load_save_key(),JSON.stringify([search_ex_list.value,attr_list.value]));};
      
//      pn_filter.childNodes[11].onclick= function(){
//        var str = pn_filter.childNodes[10].value;
//        var time = Date.now() - (parseInt(str.replace(/:.*/,''),10)*60+parseInt(str.replace(/[^:]*:/,''),10))*60000;
//        pn_filter.childNodes[8].value = new Date(time).toLocaleString();
//        pref_func.apply_prep(pn_filter,true);
//        catalog_filter_changed();
//      };
//      if (pn12_0_2.childNodes[0].checked) cnst.show_hide(pn_filter);
//      pn12_1.style.width  = '';
//      pn12_1.style.height = '';

      var scroll_event_src = (embed_catalog || embed_page)? window : triage_parent;
      var pn12_triage;
      var triage_str;
      make_triage_entry();
      function remake_triage(){
        catalog_triage_out();
        if (pref.tooltip.show) pref_func.tooltips.remove_hier(pn12_triage);
        make_triage_entry();
      }
      function make_triage_entry(){
        var pn12_triage_all = new common_func.Triage(pref.catalog_triage_str, {onclick:triage_event, wheelpatch:(!embed_catalog && !embed_page)? triage_wheel : null, name:'pn_catalog_triage'});
        pn12_triage = pn12_triage_all.pn;
        triage_str = pn12_triage_all.str;
        pn12_triage.style.position = 'absolute';
        if (pref.tooltip.show) pref_func.tooltips.add_hier(pn12_triage);
//        var pn12_triage_all = common_func.make_triage({onclick:triage_event, wheelpatch:(!embed_catalog)? triage_wheel : null});
//        pn12_triage = pn12_triage_all.pn;
//        triage_str = pn12_triage_all.str;
//        pn12_triage.style.position = 'absolute';
//        pn12_triage.name = 'pn_catalog_triage';
//        if (pref.tooltip.show) pref_func.tooltips.add(pn12_triage);
//        pn12_triage.addEventListener('mouseover', catalog_triage_out_clear, false);
//        pn12_triage.addEventListener('mouseout' , catalog_triage_out_delay, false);
        pn12_triage.onmouseover = triage_in;
        pn12_triage.onmouseout  = triage_out;
      }
//      function make_triage(args){
//        var triage_str = [];
//        var pn_triage = document.createElement('div');
////        pn_triage.style.position = 'absolute';
////        pn_triage.name = 'pn_catalog_triage';
//        pn_triage.className = 'catalog_triage_parent';
//        var triage_str_lines = pref.catalog_triage_str.replace(/\/\/.*/mg,'').split('\n');
//        for (var i=triage_str_lines.length-1;i>=0;i--) if (triage_str_lines[i]==='') triage_str_lines.splice(i,1);
//        var triage_style_replace_list = (!brwsr.ff)? ['background','background-color'] : [];
//        for (var i=0;i<triage_str_lines.length;i++)
//          triage_str[i] = triage_str_lines[i].split(',');
//        for (var i=0;i<triage_str.length;i++) {
//          for (var j=0;j<triage_str[i].length;j+=3) {
//            var triage_button = document.createElement('button');
//            triage_button.innerHTML = triage_str[i][j+1];
//            triage_button.name = i+','+j;
//            triage_button.className = 'catalog_triage_button';
//            var triage_styles = (triage_str[i][j+2])? triage_str[i][j+2].split(';') : [];
//            for (var k=0;k<triage_styles.length;k++) {
//              var style_str = triage_styles[k].replace(/:.*/,'');
//              for (var m=0;m<triage_style_replace_list.length;m+=2) style_str = style_str.replace(triage_style_replace_list[m],triage_style_replace_list[m+1]);
//              triage_button.style[style_str] = triage_styles[k].replace(/[^:]*:/,'');
//            }
////            triage_button.onclick = triage_factory(i,j);
//            triage_button.onclick = args.onclick;
//            pn_triage.appendChild(triage_button);
//            if (args.wheelpatch) triage_button.onmousewheel = triage_wheel;
//          }
//          pn_triage.appendChild(document.createElement('br'));
//        }
////        pn_triage.onclick = function(e){  // also works, but CSS is the better.
////          e.preventDefault();
////          var evt = document.createEvent('MouseEvents');
////          evt.initUIEvent('click', false, true, window, 1);
////          threads[pn12_triage_thread][0].dispatchEvent(evt);
//////console.log('aaa');
////        };
//        return {pn:pn_triage, str:triage_str};
//      }
      function triage_wheel(e){ // patch
        catalog_triage_out();
        pref_func.tooltips.hide();
        e.preventDefault();
//        triage_parent.dispatchEvent(e); // copy is required.
          var evt = document.createEvent('MouseEvents');
        evt.initMouseEvent(e.type, e.canBubble, e.cancelable, e.view,
                   e.detail, e.screenX, e.screenY, e.clientX, e.clientY,
                   e.ctrlKey, e.altKey, e.shiftKey, e.metaKey,
                   e.button, e.relatedTarget);
        triage_parent.dispatchEvent(evt); // seems not to work...
      };
      var pn12_triage_thread;
//      pn12_triage.childNodes[0].onclick = function(){search_ex_list.value = search_ex_list.value + ',' + pn12_triage_thread + '\n';pref_func.apply_prep(pn_filter,true);catalog_filter_changed();catalog_triage_out();};
//      pn12_triage.childNodes[2].onclick = function(){
////        var key = /8chan\/meta\/18578(@[^,]*)*,/;
//        var key = new RegExp(pn12_triage_thread +'(@[^,]*)*(,|$)','g');
//        search_ex_list.value = search_ex_list.value.replace(/,,+/,',').replace(key,'') + ',' + pn12_triage_thread + '@' + new Date(threads[pn12_triage_thread][8] + pref.localtime_offset*3600000).toLocaleString()+'\n';
//        pref_func.apply_prep(pn_filter,true);
//        catalog_filter_changed();
//        catalog_triage_out();
//      };
      function triage_event(){
        var flds = this.name.split(',');
        var i = parseInt(flds[0].replace(/[^\(]*\(/,''),10);
        var j = parseInt(flds[1].replace(/\).*/,''),10);
//      function triage(i,j){
        var name = pn12_triage_thread;
//        triage_exe(name,triage_str[i][j],triage_str[i][j+2],true);
////        pref_func.apply_prep(search_ex_list,true);
////        pref_func.apply_prep(attr_list,true);
////        pref_func.apply_prep(watch_list,true);
//        if (triage_str[i][j]==='UNDO') catalog_attr_changed();
//        else catalog_attr_set(name,threads[name][0]);
//        if (triage_str[i][j]==='WATCH' || triage_str[i][j]==='UNWATCH') show_catalog(name);
//        else catalog_filter_changed();
////        catalog_triage_out();
        triage_exe_0(name,triage_str[i][j],triage_str[i][j+2],true);
      }
      function triage_exe_pipe(args){triage_exe_0(args[0],args[1],args[2],args[3],args[4]);}
      function triage_exe_0(name,tri_str_ex,tri_str_attr,hist,datetime){
        var changed = triage_exe(name,tri_str_ex,tri_str_attr,hist,datetime);
        name = changed.name;
        if (changed.attr) catalog_attr_set(name,threads[name][0]);
        if (changed.ex) threads[name][9] = catalog_filter_query(name);
        if (changed.watch) reorder_thread_idx(name);
        if (changed.ex || changed.watch) show_catalog(name);
      }
      function triage_exe(name,tri_str_ex,tri_str_attr,hist,datetime){ // KILL,TIME,UNDO,NONE,WATCH,UNWATCH,DELETE,GO
        if (tri_str_ex==='UNWATCH') common_func.modify_bookmark(name,false);
        var changed = {ex:false, attr:false, watch:false, name:name};
        if (tri_str_ex==='GO') {click_thread(name);return changed;}
        if (tri_str_ex!=='UNDO') {
          if (hist) {
            if (triage_history.length>=pref.catalog_triage_hist*4) triage_history.splice(0,4);
            triage_history.push(arguments);
            triage_history.push(search_ex_list.value);
            triage_history.push(attr_list.value);
            triage_history.push(watch_list.value);
          }
          var key = new RegExp('(^|,)'+name.replace(/\+/,'\\+')+'([\\^@][^,\n]*)*(,|\n|$)','mg');
//          if (tri_str_ex.search(/KILL|TIME|WATCH/)!=-1) { // contains UNWATCH
          if (['KILL','TIME','WATCH','UNWATCH','DELETE'].indexOf(tri_str_ex)!=-1) {
//            var datetime = threads[name][8][0] + pref.localtime_offset*3600000; // NO BLOCK SCOPE
//            var datetime = ((threads[name][8][0]>threads[name][8][4])? threads[name][8][0] : threads[name][8][4]) + pref.localtime_offset*3600000; // NO BLOCK SCOPE
//            var datetime = (tri_str_ex!=='DELETE')? threads[name][8][4] + pref.localtime_offset*3600000 : 0; // NO BLOCK SCOPE
            if (!datetime) datetime = (tri_str_ex!=='DELETE')? (threads[name][8][4]||threads[name][8][0]) : 0; // NO BLOCK SCOPE
            var millisec = datetime%1000; // NO BLOCK SCOPE
            var time_str = '@' + new Date(datetime).toLocaleString() + ((datetime%1000==0)? '' : '.'+millisec); // NO BLOCK SCOPE
            var wat_str = watch_list.value.replace(key,',')
//            if (tri_str_ex.search(/KILL|UNWATCH/)==-1) {
            if (tri_str_ex!=='DELETE') {
//              if (['TIME','WATCH'].indexOf(tri_str_ex)!=-1) {
              if (tri_str_ex==='WATCH' || tri_str_ex==='TIME' && pref.catalog.auto_watch) {
                wat_str += ',' + name + time_str + '\n'; // TIME or WATCH
                mark_read_thread(name, true);
              } else mark_read_thread(name, false);
            }
            watch_list.value = wat_str.replace(/,,+/g,',').replace(/^,/g,'').replace(/\n,/g,'\n').replace(/\n\n+/g,'\n').replace(/^\n/,'');
            changed.watch = true;
          }
//          if (tri_str_ex.search(/KILL|TIME|NONE/)!=-1) {
          if (['KILL','TIME','NONE','DELETE'].indexOf(tri_str_ex)!=-1) {
            var ex_str = search_ex_list.value.replace(key,',');
            if (tri_str_ex!=='NONE' && tri_str_ex!=='DELETE') ex_str = ex_str + ',' + name + ((tri_str_ex.search(/TIME/)!=-1)? time_str : '') +'\n';
            search_ex_list.value = ex_str.replace(/,,+/g,',').replace(/^,/g,'').replace(/\n,/g,'\n').replace(/\n\n+/g,'\n').replace(/^\n/,'');
            changed.ex = true;
          }
          if (['KILL','TIME','NONE','DELETE'].indexOf(tri_str_ex)!=-1) {
            var at_str = attr_list.value.replace(key,',') + ((tri_str_attr!=='')? ',' + name + '^' +tri_str_attr : '') +'\n';
            attr_list.value = at_str.replace(/,,+/g,',').replace(/^,/g,'').replace(/\n,/g,'\n').replace(/\n\n+/g,'\n').replace(/^\n/,'');
            changed.attr = true;
          }
        } else {
          if (triage_history.length!=0) {
            changed.watch = (watch_list.value     !== triage_history[triage_history.length-1]);
            changed.attr  = (attr_list.value      !== triage_history[triage_history.length-2]);
            changed.ex    = (search_ex_list.value !== triage_history[triage_history.length-3]);
            watch_list.value = triage_history.pop();
            attr_list.value = triage_history.pop();
            search_ex_list.value = triage_history.pop();
            var undo_args = triage_history.pop(); // from arguments
            changed.name = undo_args[0];
          }
        }
//        if (tri_str_ex==='UNDO') re_sort_thread();
//        else if (['WATCH','UNWATCH'].indexOf(tri_str_ex)!=-1) reorder_thread_idx(name);
//        if (tri_str_ex!=='NONE') pref_func.apply_prep(watch_list,true);
//        if (['UNDO','KILL','TIME','NONE'].indexOf(tri_str_ex)!=-1) pref_func.apply_prep(search_ex_list,true);
//        if (['WATCH','UNWATCH'].indexOf(tri_str_ex)==-1) pref_func.apply_prep(attr_list,true);
        if (changed.watch) pref_func.apply_prep(watch_list,true);
        if (changed.ex)    pref_func.apply_prep(search_ex_list,true);
        if (changed.attr)  pref_func.apply_prep(attr_list,true);
        if (tri_str_ex==='UNDO' && changed.watch) { // re-order
          threads[name][19][0] = - get_watch_time_of_a_thread(name,threads[name][8][1]); // REMAKE, THIS IS SEEMS TO BE A BUG BECAUSE OF INCONSISTENCY.
          threads[changed.name][21] = true;
          threads[changed.name][19][6] = -2; // force to recount.
          catalog_refresh_watch();
        }
        return changed;
      }
      var triage_history = [];

      var pn12_triage_thread = null;
      var pn12_triage_timer = null;
      function catalog_triage_in(name){
        if (typeof(name)==='object') name = this.name;
//console.log('catalog_triage_in: '+name);
        if (pref.catalog_triage) { // working.
          if (!pn12_triage_thread) pn12_triage = triage_parent.appendChild(pn12_triage);
          else {
            catalog_triage_out_clear();
            if (pn12_triage_thread == name) return; // for faster execution.
            if (threads[pn12_triage_thread]) threads[pn12_triage_thread][0].removeEventListener('mouseout', catalog_triage_out_delay, false);
          }
          var left = threads[name][0].offsetLeft - triage_parent.scrollLeft;
          if (pref.catalog_triage_place==='topLeft' || pref.catalog_triage_place==='bottomLeft') {
            pn12_triage.style.left = left + 'px';
            pn12_triage.style.right = '';
          } else {
            pn12_triage.style.right = triage_parent.offsetWidth - left - threads[name][0].offsetWidth + 'px';
            pn12_triage.style.left = '';
          }
          var top = threads[name][0].offsetTop  - triage_parent.scrollTop;
          if (pref.catalog_triage_place==='topLeft' || pref.catalog_triage_place==='topRight') {
            if (top<triage_parent.offsetTop) top = triage_parent.offsetTop;
            pn12_triage.style.top   = top + 'px';
            pn12_triage.style.bottom = '';
          } else {
            pn12_triage.style.bottom = window.innerHeight - top - threads[name][0].offsetHeight + 'px';
            pn12_triage.style.top = '';
          }
//          if (pn12_triage_thread!=name) {
//            catalog_triage_out_clear();
//            pn12_triage = threads[name][0].appendChild(pn12_triage);
//            if (pn12_triage_thread!==null) threads[pn12_triage_thread][0].removeEventListener('mouseout', catalog_triage_out_delay, false);
//          }
//          pn12_triage.style.left  = '0px';
//          pn12_triage.style.top  = '0px';
          pn12_triage_thread = name;
          threads[name][0].addEventListener('mouseout', catalog_triage_out_delay, false);
        } else catalog_triage_out();
      }
//      if (pref.tooltip.show) pref_func.tooltips.add(pn12_triage);
      function triage_in(e){
//console.log('triage_in');
//        if (pref.tooltip.show) pref_func.show_tooltip('catalog_triage',e.clientX,e.clientY);
        catalog_triage_out_clear();
      }
      function catalog_triage_out_clear(){
        if (pn12_triage_timer) {clearTimeout(pn12_triage_timer);pn12_triage_timer=null;}
      }
      function triage_out(e){
//console.log('triage_out');
//        if (pref.tooltip.show) pref_func.hide_tooltip('catalog_triage',e.clientX,e.clientY);
        catalog_triage_out_delay();
      }
      function catalog_triage_out_delay(){
        if (!pn12_triage_timer) pn12_triage_timer = setTimeout(catalog_triage_out,pref.catalog_popdown_delay);
      }
      function catalog_triage_out(){
//console.log('catalog_triage_out');
        if (pn12_triage_thread) {
          threads[pn12_triage_thread][0].removeEventListener('mouseout', catalog_triage_out_delay, false);
          pn12_triage = triage_parent.removeChild(pn12_triage);
//          pn12_triage = threads[pn12_triage_thread][0].removeChild(pn12_triage);
          pn12_triage_thread = null;
        }
      }

      if (embed_catalog || embed_page) {  // for native catalog
        pn12.style.display = 'none';
    setTimeout(function(){ // patch for liveTag.
//        var catalog_native_destroy = site2[site.nickname].catalog_native_prep0(threads,show_init_native,pn12_0_4,pn12_0_2,onchange_funcs['catalog.indexing']);
//        for (var name in threads) init_native(name);
        var date = Date.now()
//        var ths = site2[site.nickname].catalog_native_prep(date,pn12_0_4,pn12_0_2,health_indicator.pn_hi);
        var ths = site2[site.nickname].catalog_native_prep(date,pn12_0_4,pn12_0, embed_catalog);
        for (var i=0;i<ths.length;i++) {
          if (embed_catalog || embed_page) ths[i].exist = true;
//          insert_thread_from_native(ths[i], site.nickname, site.board, false, date);
          if (pref.liveTag.use) ths[i].tags = liveTag.prep_tags(ths[i]); // extract tags in op.
          insert_thread_passed_test(ths[i], (site.whereami==='catalog')? 'catalog_html' : 'page_html', date);
          if (pref.liveTag.use && pref.liveTag.from==='post') liveTag.list_nup.add(ths[i].key);
        }
        show_catalog();
//        if (pref.catalog.filter.tag_scan_auto) scan_tags();
//        catalog_clear_threads(pref.catalog.max_threads);
        if (pref.thread_reader.own_posts_tracker && pref.thread_reader.clean_up_own_posts && site.whereami==='catalog') site2[site.nickname].clean_up_own_posts(ths,site.board);
    },0);
      }
//      function init_native(name){
//        threads[name][1] = false;
//        threads[name][2] = [catalog_triage_in, null];
//        threads[name][5] = click_thread_native;
//        threads[name][6] = null;
//        threads[name][9] = [true];
////        threads[name][9] = catalog_filter_query(name);
//        threads[name][10]= null;
//        threads[name][11]= null;
//        threads[name][12]= null;
//        var ch = threads[name][0];
//        ch.name = name;
//        ch.addEventListener('mouseover', catalog_triage_in, false);
//        ch.addEventListener('click', click_thread_native, true);
//        catalog_attr_set(name,threads[name][0]);
//        if (!embed_catalog) {
//          ch.style.width  = pref.catalog_size_width + 'px';
//          ch.style.height = pref.catalog_size_height + 'px';
//          ch.style.float = 'left';
//          ch.style.overflow = 'hidden';
//          ch.style.background = '#e5ecf9';
//        }
//        insert_thread_idx(name);
//      }
//      function click_thread_native(){
//        var name = this.name;
//        open_new_thread(threads[name][7], name);
//      }
//      function show_init_native(){
//        for (var name in threads) threads[name][9] = catalog_filter_query(name);
//        show_catalog_native();
//        if (pref.catalog.filter.tag_scan_auto) scan_tags();
//      }
//      function show_catalog_native(){
//        catalog_triage_out();
//        pref_func.tooltips.hide();
//        for (var name in threads) {
//          var ch = threads[name][0];
//          if (!threads[name][1] && threads[name][9][0]) {
//            threads[name][1] = true;
//            ch.style.display = 'inline-block';
//            catalog_attr_set(name,ch);
//          } else if (threads[name][1] && !threads[name][9][0]) {
//            threads[name][1] = false;
//            ch.style.display = 'none';
//          }
//        }
//      }

//      function insert_thread_with_test_from_catalog_json(th, snoop, date_load){
//        if (threads[th.key] && threads[th.key][8][0]>=th.time_bumped && threads[th.key][8][2]==th.nof_posts && threads[th.key][8][3]==th.nof_files) return false;
//        site2[th.domain].parse_funcs['catalog_json'].entry(th,['key','pn']);
//
//        var date = [th.time_bumped, th.time_created, th.nof_posts, th.nof_files]; // temporal
//        th.search_obj = [ th.com, th.sub, th.name, '', '', '', '', '']; // temporal
//        var url = site2[th.domain].make_url3(th.board, th.no, '0'); // temporal
//        insert_thread(th.pn, th.domain, th.page, date_load, th.key, th.pn.innerHTML, date, th.search_obj, url, true, th);
//        return true;
//      }
//      function insert_thread_with_test_from_catalog_html(th, snoop, date_load){
//        if (threads[th.key] && threads[th.key][8][0]>=th.time_bumped && threads[th.key][8][2]==th.nof_posts && threads[th.key][8][3]==th.nof_files) return false;
////        var th2 = site2[th.domain].catalog_from_native_1(th.pn,th.board);
////        insert_thread_from_native(th2, th.domain, th.board, snoop, date_load);
//        site2[th.domain].parse_funcs['catalog_html'].entry(th,['sub','name','com','page']);
//        var date = [th.time_bumped, th.time_created, th.nof_posts, th.nof_files]; // temporal
//        th.search_obj = [ th.com, th.sub, th.name, '', '', '', '', '']; // temporal
//        var url = site2[th.domain].make_url3(th.board, th.no, '0'); // temporal
//        insert_thread(th.pn, th.domain, th.page, date_load, th.key, th.pn.innerHTML, date, th.search_obj, url, true, th);
//        return true;
//      }

      function insert_thread_with_test(th, type, date_load){
        var name = th.key;
        if (threads_candidates_of_deletion && threads_candidates_of_deletion[name]) delete threads_candidates_of_deletion[name];
        if (threads[name] &&
//            ((threads[name][8][4] || threads[name][8][0])>=(th.time_posted || th.time_bumped)) && // vichan has inconsistency in time between catalog.json and thread.json.
            (((threads[name][8][0]>threads[name][8][4])? threads[name][8][0] : (threads[name][8][4] || threads[name][8][0])) >= ((th.time_bumped > th.time_posted)? th.time_bumped : (th.time_posted || th.time_bumped))) && // vichan has inconsistency in time between catalog.json and thread.json.
            threads[name][8][2]==th.nof_posts && threads[name][8][3]==th.nof_files
          && (!threads[name][21] || (th.type_parse!=='thread_html' && th.type_parse!=='thread_json'))) {
//        if (threads[name] && threads[name][8][0]>=th.time_bumped && threads[name][8][2]==th.nof_posts && threads[name][8][3]>=th.nof_files) {
////////          if (threads[name] && pref.catalog_footer_show_page && threads[name][24] && threads[name][24][2]!=th.page) insert_footer3(name,null,th.page);
          return false;
        }
if (pref.test_mode['0']) {
        site2[th.domain].parse_funcs[type].entry(th,site2[th.domain].parse_funcs[type]['after_test']);
}
        insert_thread_passed_test(th, type, date_load);
        return true;
      }
      function insert_thread_passed_test(th, type, date_load){
//        var date = [th.time_bumped, th.time_created, th.nof_posts, th.nof_files]; // temporal
//        th.search_obj = [ (th.com)? th.com : '', (th.sub)? th.sub : '', (th.name)? th.name : '', '', '', '', '', '']; // temporal
        var url = null;
////        if (type==='thread_html' || type==='page_html') {
//////          if (site.nickname!==th.domain) site2[th.domain].absolute_link(th.pn, th.board); // patch for url. BUT BUG.
////          url = site2[th.domain].get_thread_link(th.pn,th.board,pref.catalog_click!='expand',th.key);
////          th.html_org = th.pn.innerHTML; // patch, must be before trim.
////if (!pref.test_mode['5']) {
////          trim_html(th.pn, th.domain, pref.catalog_format.show, th.key); // temporal
////}
////        }
//////        } else url = site2[th.domain].make_url3(th.board, th.no, '0'); // temporal
//////        site2[th.domain].parse_funcs[type]['finisher'](th);
//        insert_thread(null, th.domain, th.page, date_load, th.key, (th.html_org)? th.html_org : th.pn.innerHTML, date, th.search_obj, url, true, th, type);
        insert_thread(null, th.domain, th.page, date_load, th.key, null, th.search_obj, url, true, th, type);
      }

////////      function insert_thread_from_native(th, nickname, board, snoop, date_load){
////////        var name = nickname + board + th.no;
////////        var date = [th.time_bumped, th.time_created, th.nof_posts, th.nof_files];
////////        var url = site2[nickname].make_url3(board, th.no, '0');
//////////        if (threads[name] && threads[name][8][0]>=date[0]) return 0;
////////        if (threads[name] && threads[name][8][0]>=date[0] && threads[name][8][2]==th.nof_posts && threads[name][8][3]==th.nof_files) return 0;
//////////        if (threads[name] && threads[name][8][0]==date[0] && threads[name][8][2]!=th.nof_posts && nickname==='8chan' && pref.catalog.order.find_sage_in_8chan) threads[name][21] = true; // for 8chan.
////////        return insert_thread(th.pn, nickname, th.page_no, date_load, name, th.pn.innerHTML, date, th.search_obj, url, true, th);
////////      }

      function re_trim_html(){
        for (var name in threads) {
          var date = get_mark_time(name,pref.catalog.filter.time_mark,pref.catalog.filter.list_mark_time,pref.catalog.filter.watch_list_mark_time);
          if (date===0) date = Infinity;
          var dbt = cnst.name2domainboardthread(name,true);
          site2[dbt[0]].mark_newer_posts(threads[name][0],date);
        }
      }
      function trim_html(src,nickname,format, name){
if (!pref.test_mode['7']) { // memory leak debug.
  if (!pref.test_mode['8']) {
    if (!pref.test_mode['9']) {// safe
      if (!pref.test_mode['10']) { // safe 30 min.
if (!pref.test_mode['11']) {
        if (!format.fileinfo) site2[nickname].remove_files_info(src);
}
if (!pref.test_mode['12']) {
//        if (!format.posts)    site2[nickname].remove_posts(src,0);
        site2[nickname].remove_posts(src,(!format.posts)? 0 : pref.catalog_t2h_num_of_posts);
}
if (!pref.test_mode['13']) {
        if (format.contents)  site2[nickname].format_thread_contents(src);
}
      }
        if (format.layout)    site2[nickname].format_thread_layout(src);
        if (format.style)     site2[nickname].format_thread_style(src);
                              site2[nickname].format_thread_always(src);
    }
        if (pref.catalog_localtime) site2[nickname].format_time(src);
//        if (pref.catalog.filter.time_mark) site2[nickname].mark_newer_posts(src,date);
        var date = get_mark_time(name,pref.catalog.filter.time_mark,pref.catalog.filter.list_mark_time,pref.catalog.filter.watch_list_mark_time);
        if (date>0) site2[nickname].mark_newer_posts(src,date);
  }
        if (pref.catalog_size_tn_resize) site2[nickname].format_remove_tn_area_size(src);
}
      }
////////      function insert_thread_from_page(src, nickname, boardname, op_no, page_no, nof_posts, nof_files, snoop, date_load){
////////        var name = nickname + boardname + op_no;
////////        if (snoop && !pref.catalog_promiscuous && !threads[name]) {
////////          var hit = false;
////////          for (var i=0;i<load_list.refresh.tgts.length;i++)
////////            if (load_list.refresh.tgts[i][0].indexOf(nickname+boardname+'p'+page_no)!=-1 ||
////////                load_list.refresh.tgts[i][0].indexOf(nickname+boardname+op_no)!=-1) {hit=true;break;}
////////          if (!hit) return 0;
////////        }
////////        var date = site2[nickname].get_time_of_posts(src);
////////        if (threads[name] && threads[name][13]<date_load) update_page_in_footer(name,page_no,date_load);
////////        if (threads[name] && threads[name][8][0]>=date[0]) return 0;
//////////console.log('In :'+name);
////////        var url = site2[nickname].get_thread_link(src,boardname,pref.catalog_click!='expand',name);
//////////        var date_mark = Date.parse(pref.catalog.filter.time_str) - pref.localtime_offset*3600000;
//////////        console.log(name+', '+date);
//////////        var src1 = document.createElement('div');
//////////        src1.innerHTML = src.innerHTML;
////////        var html_org = src.innerHTML;
////////        var src2 = document.createElement('div');
////////        src2.innerHTML = src.innerHTML;
////////        var cross_domain = pref.catalog_board_list_obj[board_sel.selectedIndex][0]['domain']!=nickname;
////////        var cross_board  = pref.catalog_board_list_obj[board_sel.selectedIndex][0]['board']!=boardname;
////////        date = date.concat(site2[nickname].insert_footer(src,page_no,((cross_domain)? nickname : '')+((cross_board)? boardname : ''),pref.catalog_footer,date,nof_posts,nof_files));
//////////        trim_html(src,  nickname, pref.catalog_format.show, date_mark);
////////////        trim_html(src1, nickname, pref.catalog_format.hover, date_mark);
//////////        trim_html(src2, nickname, pref.catalog_format.search, date_mark);
////////        trim_html(src,  nickname, pref.catalog_format.show, name);
////////        trim_html(src2, nickname, pref.catalog_format.search, name);
////////        return insert_thread(src, nickname, page_no, date_load, name, html_org, date, src2, url, false, {board:boardname});
////////      }
      function image_resize1_onload() {
        this.removeEventListener('load',common_func.image_resize1_onload,false);
        common_func.image_resize(this, pref.catalog_size_tn1_width, pref.catalog_size_tn1_height);
      }
      function image_resize2_onload() {
        this.removeEventListener('load',common_func.image_resize2_onload,false);
        common_func.image_resize(this, pref.catalog_size_tn2_width, pref.catalog_size_tn2_height);
      }
//      function convert_html(name,th){
//        if (!embed_catalog && pref.catalog.text_mode.mode==='text') {
//          var text = document.createElement('span');
//          text.innerHTML = ((pref.catalog.text_mode.sub  && threads[name][4][1][0])? '&emsp;' + threads[name][4][1][0] : '') +
//                           ((pref.catalog.text_mode.name && threads[name][4][2][0])? '&emsp;' + threads[name][4][2][0] : '') +
//                           ((pref.catalog.text_mode.com  && threads[name][4][0][0])? '&emsp;' + threads[name][4][0][0] : '');
//          var footer_new = document.createElement('span');
//          footer_new.innerHTML = th.footer.innerHTML; // make footer on demand.
//          th.footer = footer_new;
//          th.pn.innerHTML = '';
//          th.pn.appendChild(th.footer);
//          th.pn.appendChild(text);
//          threads[name][18] = 'text';
//        } else {
//          th.pn.innerHTML = threads[name][25][1];
//          th.footer = threads[name][25][0];
//        }
//      }
      function insert_thread(src, nickname, page_no, date_load, name, html_org, src2, url, from_native, th, type){
//console.log('insert_thread: '+name+','+th.page+', '+th.nof_posts+', '+th.nof_files);
        if (!th.exist && th.type_data==='html') document.adoptNode(th.pn);  // KC causes memory leak if I don't use adoptNode().
//        if (th.pn.parentNode) th.pn.parentNode.removeChild(th.pn); // redundant.
        if (site.nickname!==th.domain) site2[th.domain].absolute_link(th.pn, th.board);
        var init_new = false;
        var ch = threads[name];
        var date = [th.time_bumped, th.time_created, th.nof_posts, th.nof_files, th.time_posted];
        if (ch==undefined) {
//console.log('insert_thread: NEW: '+name);
          if ((th.domain!==site.nickname || site.whereami+'_html'!=type) && pref.catalog.mimic_base_site && th.pn && site2[site.nickname].catalog_json2html3) { // for KC.
//          if ((th.domain!==site.nickname || site.whereami!='catalog') && pref.catalog.mimic_base_site && th.pn && site2[site.nickname].catalog_json2html3) { // cause document leak in KC
            th.pn = site2[site.nickname].catalog_json2html3(th,th.board,th.op_img_url);
            Object.defineProperty(th, 'footer', {value: site2[site.nickname].parse_funcs['catalog_json'].footer(th), writable:true, enumerable:true, configurable:true});
            th.type_html = 'catalog_html';
            th.type_html_domain = site.nickname;
            th.parse_funcs_html = site2[site.nickname].parse_funcs['catalog_html']; // overwrite.
          } else {
            if (type==='thread_html' || type==='page_html') {
              url = site2[th.domain].get_thread_link(th.pn,th.board,(pref.catalog_click==='open' && !embed_page),th.key);
              html_org = th.pn.innerHTML; // patch, must be before trim.
if (!pref.test_mode['5']) {
              trim_html(th.pn, th.domain, pref.catalog_format.show, th.key); // temporal
}
            }
            if (th.type_data==='html') site2.common.remove_by_tagname(th.pn,'script');
          }
if (pref.test_mode['19']) { // stability test.
          if (th.parse_funcs_html.th_init) th.parse_funcs_html.th_init(th); // BUG, should be moved into show_catalog() because threads aren't shown all the time and cause memory leak.
}
          init_new = true;
          if (th && th.exist) ch = th.pn; // native on base board
          else ch = th.pn;
          ch.name = name;
          if (!embed_catalog || (th.domain!==site.nickname && !pref.catalog.mimic_base_site)) {
            ch.style.width  = ((pref.catalog.text_mode.mode==='text')? pref.catalog_size_text_width  : pref.catalog_size_width ) + 'px';
            ch.style.height = ((pref.catalog.text_mode.mode==='text')? pref.catalog_size_text_height : pref.catalog_size_height) + 'px';
            ch.style.float = 'left';
            ch.style.overflow = 'hidden';
//            ch.style.background = '#e5ecf9';
          }
          if (!ch.style) ch['style'] = {};
//          threads[name] = [ch, false, (from_native)? [catalog_triage_in, null] : [func_in, func_pop_up],
          threads[name] = [ch, (th && th.exist), (from_native && !th.posts)? [catalog_triage_in, null] : [func_in, func_pop_up],
                           [html_org, nickname],
                           (th.posts)? th.posts : {sub:th.sub, com:th.com, name:th.name, trip:th.trip, filename:th.filename},
//                           click_thread, // 5, click function.
                           [], // 5, click source
                           null, url, date, true,
//                           (from_native)? click_thread_native : click_thread, null, url, date, true,
                           null,
                           null, null, date_load, page_no, 0,
//                           (from_native && brwsr.ff)? th.init_func : null, // 16
//                           null, // 16, NOT USED
                           { dbt: common_func.name2domainboardthread(name,true),
//                             th_destroy: th.parse_funcs_html.th_destroy,
                             parse_funcs: th.parse_funcs,
                             systemSticky: th.sticky,
                             sticky_icon: null,
                             type_html: th.type_html,
//                             popups: null, posts:null,
                           }, // 16, others
//                           ch[brwsr.innerText].match(tags_scan_regex), // 17, tag
                           null, // 17, tag
                           th.type_html, // 18, type of html
                           null, // 19, tracking info
//                           [0,0,0,0,null,false,-2, 0, true, [], 0], // debug
                             // 19, time_of_checked, num_of_unread_replies_TO_ME, num_of_unread_replies,
                             //     time_of_checked_time_internal, args_for_desktop_notification, init,
                             //     time_of_checked_old, num_of_unread_old, inital_loop // for faster execution.
                             //     tag_temp, num_of_checked_posts_so_far
                           th.sticky, // 20 sticky.
//                           (nickname==='8chan' && from_native && pref.catalog.order.find_sage_in_8chan), // 21, watch.
                           false, // 21, watch.
                           {}, // 22, attr info for rollback.
                           common_func.shallow_copy_1(th.parse_funcs.missing_info), // 23, for last post indexing.
                           null, // 24, footer.
                           null, // 25, text_mode [0]: footer, [1]: html_backup
                           th.op_img_url]; // 26 op_iamge_url
//          if (name in threads_last_deleted) threads[name][8][4] = threads_last_deleted[name].last_post_time;
          threads[name][17] = liveTag.prep_tags(th);
          threads[name][19] = liveTag.mems[th.domain][th.board][th.no][2];
          common_func.set_value_to_root(threads[name][19],'5',true);
////          if (pref.liveTag.use) {
////            var tags_b = [[],[]];
////            var tag_idx;
////            if (pref.liveTag.inherit_board_name) {
////              tag_idx = (pref.liveTag.lock_board_name)? 0 : 1;
////              tags_b[tag_idx][0] = '#'+th.board.replace(/\//g,'');
////            }
//////            if (pref.liveTag.inherit_board_tags) {
//////              tag_idx = (pref.liveTag.lock_board_tags)? 0 : 1;
//////              tags_b[tag_idx] = tags_b[tag_idx].concat(site3[th.domain][th.board].tags);
//////            }
////            site2[th.domain].check_reply.check_t1(th, threads[name][19]);
////            if (threads[name][19][9].length!=0) {
////              tag_idx = (pref.liveTag.lock_tags_in_op)? 0 : 1;
////              tags_b[tag_idx] = tags_b[tag_idx].concat(threads[name][19][9]);
////            }
////            if (tags_b[0].length!=0) {
////              threads[name][17][0] = liveTag.update_tags_in_th(tags_b[0], [], {}, pref.liveTag.max, name);
////              threads[name][17][0][2] = ' '+threads[name][17][0][0].toString().replace(/,/,', ');
////              if (threads[name][17][0][2]!==' ') threads[name][17][0][2] += ', ';
////            }
////            if (tags_b[1].length!=0) threads[name][17][1] = liveTag.update_tags_in_th(tags_b[1], [], threads[name][17][0][1], pref.liveTag.max-threads[name][17][0][0].length, name);
////          }
          ch.addEventListener('mouseover', threads[name][2][0], false);

          common_func.dom_addEventListener(threads[name][5], th.pn, 'click', click_thread_whole);
          common_func.dom_addAttribute(th.pn, 'class', pref.script_prefix+'_thread');
          for (var i=0;i<th.tn_as.length;i++) {
            th.tn_as[i].onclick = click_thread_tn; // preventDefault is in this event handler.
            common_func.dom_addAttribute(th.tn_as[i], 'class', pref.script_prefix+'_thumbnail');
          }
          if (pref.catalog_size_tn_resize && !embed_catalog && !embed_page) { // BUG, should be moved into show_catalog() because threads aren't shown all the time and cause memory leak.
            for (var i=0;i<th.tn_imgs.length;i++) {
              if (i===0) th.tn_imgs[i].addEventListener('load',image_resize1_onload,false);
              else th.tn_imgs[i].addEventListener('load',image_resize2_onload,false);
            }
          }
//          var click_area = (pref.catalog_click_area==='entire')? [ch] : site2[th.type_html_domain].get_click_area(ch, th); // patch // working code.
//          for (var i=0;i<click_area.length;i++) {
//            common_func.dom_addEventListener(threads[name][5], click_area[i], 'click', click_thread);
////            click_area[i].addEventListener('click', click_thread, true);
////            threads[name][5].push([click_area[i], 'click', click_thread]);
//            var click_area_style = click_area[i].getAttribute('style');
//            click_area_style = ((click_area_style)? click_area_style + ';' : '') + 'cursor:pointer';
//            click_area[i].setAttribute('style',click_area_style);
//            click_area[i].setAttribute('name',name); // for click_thread_native
//          }
//          if (pref.catalog_size_tn_resize && !embed_catalog) {
//            if (pref.catalog_click_area==='entire') click_area = site2[th.type_html_domain].get_click_area(ch, th); // patch
//            for (var i=0;i<click_area.length;i++) {
//              if (i===0) click_area[i].addEventListener('load',image_resize1_onload,false);
//              else click_area[i].addEventListener('load',image_resize2_onload,false);
//            }
//          }

          if (pref.catalog_expand_at_initial || (pref.catalog_expand_at_initial_embed && embed_page)) expand_shrink_thread(name);
//          var dbt = threads[name][16];
//          boards[dbt[0]+dbt[1]] = null;
          boards[threads[name][16].dbt[0]+threads[name][16].dbt[1]] = null;
          threads[name][19][0] = - get_watch_time_of_a_thread(name,date[1]);
////////          threads[name][21] = false;  // must be here, refer function 'update_thread'.
////////          if (threads[name][19][0]!==0 && site2[nickname].time_revised_check(date[2])) threads[name][21] = true; // redundant???
////////          if (threads[name][19][0]===0  || threads[name][19][0]== -(threads[name][8][4]||threads[name][8][0])) threads[name][19][2] = 0; // 'threads[name][19][0]==threads[name][8][0]' is ommited because of assignment of nevative value in previous.
//          ch.innerHTML = src.innerHTML;
//console.log(name+', '+threads[name][8]);
          if (threads[name][20]===true) threads[name][16].sticky_icon = site2[nickname].add_sticky_info(threads[name][0],th.type_html); // first time only.
          catalog_attr_set(name,ch);

          if (!embed_catalog && pref.catalog.text_mode.mode==='text') { // place after th.op_img_url. // NEED TO MODIFY REMOVE_THREAD TO PREVENT MEMORY LEAK.
            var text = document.createElement('span');
            text.innerHTML = ((pref.catalog.text_mode.sub && th.sub)? '&emsp;' + th.sub : '') +
                             ((pref.catalog.text_mode.name && th.name)? '&emsp;' + th.name : '') +
                             ((pref.catalog.text_mode.com && th.com)? '&emsp;' + th.com : '');
            var footer = th.footer; // make footer on demand.
            var footer_new = document.createElement('span');
            footer_new.innerHTML = footer.innerHTML;
            th.footer = footer_new;
            th.pn.innerHTML = '';
            th.pn.appendChild(th.footer);
            th.pn.appendChild(text);
            threads[name][18] = 'text';
          }
          threads[name][24] = prep_footer3(th.footer,th.board,th.domain,th.flags);
//          convert_html(name,th);
//          threads[name][25] = [threads[name][24][0], threads[name][0].innerHTML, threads[name][18]];
          if (th.type_source==='page') {
            threads[name][16].posts = th.posts;
            if (pref.page.colorID && site2[th.domain].colorID && (!pref.page.colorID_native || !th.exist)) for (var i=0;i<th.posts.length;i++) site2[th.domain].colorID(th.posts[i].pn);
          }
          insert_footer3(name,th.flags,th.page,threads[name][17]);
        } else {
          if (embed_page && (pref.catalog_expand_at_initial_embed || pref.catalog_expand_at_initial)) {
            if (th.type_source==='page') { // PATCH, style must be set for symmetricity.
              remove_threads_events(name);
//              threads[name][0] = th.pn;
              threads[name][0].addEventListener('mouseover', threads[name][2][0], false); // add triage event
//              common_func.dom_addAttribute(th.pn, 'class', pref.script_prefix+'_thread');
//              threads[name][24] = prep_footer3(th.footer,th.board,th.domain,th.flags);
//              threads[name][0].name = name;
//              catalog_attr_set(name,threads[name][0]);
              site2[th.domain].update_posts_replace(th,threads[name][16],threads[name][0]);
            } else site2[th.domain].update_posts_add(th,threads[name][16],threads[name][0]);
          }

////////          if (threads[name][19][0]===0) { // patch // working code.
////////            threads[name][19][0] = - get_mark_time(name,pref.catalog.filter.time_watch,false,true);
////////            if (threads[name][19][0]!==0) threads[name][19][2] = 0;
////////          }
//          for (var i=0;i<threads_idx.length;i++) if (threads_idx[i]==name) {threads_idx.splice(i,1);break;}
//          if (pref.notify.desktop.use && pref.notify.desktop.reply && threads[name][8][2]!=date[2]) desktop_notifier_obj.show('New Reples in '+name,name);
          ch = threads[name][0];
////////          if (th.type_html==='page_html' || th.type_html==='thread_html') {
////////            ch.innerHTML = src.innerHTML; // faster, but can't revise footer, because this re-create DOM and th.footer is abondoned.
////////            threads[name][24] = prep_footer3(th.footer,th.board,th.domain,th.flags); // can't work 
////////          }
//          ch.innerHTML = src.innerHTML; // revise footer.
//          if (threads[name][20]===true) site2[nickname].add_sticky_info(threads[name][0],threads[name][18],threads[name][20]);
//          threads[name][19][8] = false;
          if (th.type_source!=='catalog') threads[name][3][0] = th.pn.innerHTML;
        }
        if (embed_page && pref.page.popup && site2[th.domain].popups_add) site2[th.domain].popups_add(threads[name][16], th, (!th.exist || !pref.page.popup_native));
//        if (embed_page && site2[th.domain].popups_add && th.type_data==='html' && pref.page.popup) site2[th.domain].popups_add(threads[name][16], th, (!th.exist || !pref.page.popup_native));
//          threads[name][16].popups = site2[th.domain].popups_add(threads[name][16].posts, threads[name][16].popups, th); // working code.
////////        if (threads[name][19][0]>(date[4]||date[0]) || threads[name][19][0]<-(date[4]||date[0])) threads[name][19][0] = 0; // working code.
//        if (from_native && th.update_func) th.update_func(ch,th); // temporal
//        ch.innerHTML = src.innerHTML;
//        threads[name][3] = src1.innerHTML;
//        threads[name][3][0] = html_org;
//        if (!from_native) threads[name][4] = site2[nickname].thread2search_obj(src2);
//        if (!from_native) threads[name][4] = [src2[brwsr.innerText],'','','','','','',''];
//        threads[name][4] = src2[brwsr.innerText];
//        if (!date[4]) date[4] = date[0]; // last post
//        if (threads[name][8][4] && threads[name][8][4]>date[4]) date[4] = threads[name][8][4]; // last post
//        date[5] = (threads[name][19][5])? 1 : threads[name][8][2]; // patch for native catalog. // 1 is a patch for 4chan catalog, which doesn't contain OP in last_replies.
        if (!date[0]) date[0] = threads[name][8][0];
        if (!date[4] || threads[name][8][4]<date[0]) date[4] = date[0];
        threads[name][8] = date;
//if (pref.debug_mode['4']) console.log('insert_thread: time: '+th.key+', '+threads[name][8][4]);
//        threads[name][8][4] = (from_native)? -1 : threads[name][8][0]; // last post
//        threads[name][23] = from_native; // for last post indexing.
//        threads[name][23] = from_native && type!='page_html' && (!(name in threads_last_deleted) || threads_last_deleted[name].last_post_count!=threads[name][8][2]); // for last post indexing. // patch
//        threads[name][23] = type!='page_html';
        update_thread_info(th, false);
        if (pref.catalog.filter.kwd.post && th.posts) threads[name][4] = th.posts;
        threads[name][9] = catalog_filter_query(name);
//        if (!from_native) {
//          if (threads[name][11]) threads[name][11] = remove_open_new_thread_event(threads[name][11]);
//          threads[name][11] = add_open_new_thread_event(name,site2[nickname].modify_thread_link(ch));
//        }
//        threads[name][19][5] = init_new;
////        if (threads[name][19][0]!==0) { // watching // working code.
//////          if (threads[name][8][2]-threads[name][19][2]>0) { // get new replies
////            if (pref.catalog_footer_show_nof_rep || pref.notify.desktop.reply_to_me || pref.notify.desktop.reply) threads[name][21] = true;
//////          } else if (pref.catalog_footer_show_nof_rep) site2[nickname].insert_footer2(threads[name][0],threads[name][18],threads[name][19],threads[name][8]);
//////          }
////        }

//////////        if (pref.liveTag.use || (threads[name][19][0]!==0 && (pref.catalog_footer_show_nof_rep || pref.notify.desktop.reply_to_me || pref.notify.desktop.reply))) threads[name][21] = true;
////////        if ((!pref.liveTag.use || pref.liveTag.from!=='post' || threads[name][19][5]) &&  // liveTag(post) has other system for update in 'scan_boards_keyword_callback2'
////////            (threads[name][19][0]!==0 && (pref.catalog_footer_show_nof_rep || pref.notify.desktop.notify && (pref.notify.desktop.reply_to_me || pref.notify.desktop.reply)))) threads[name][21] = true;
////////        if (th.exist && pref.liveTag.use && pref.liveTag.from==='post') threads[name][21] = true; // patch
////////
////////if (!pref.test_mode['20']) {
////////        if (threads[name][21]) {
////////          if (th.type_source==='thread' ||
////////            (th.parse_funcs.has_posts && th.last_replies && th.last_replies.length>=threads[name][8][2]-threads[name][19][10])) {
////////              update_thread(name, th, threads[name][19]);
////////              threads[name][21] = false; // must be here, refer function 'update_thread'.
////////          } else if (th.parse_funcs.has_posts && !th.last_replies) threads[name][21] = false;
//////// if (pref.test_mode['21']) threads[name][21] = false;
////////////        if (threads[name][21] && th.parse_funcs.has_posts) { // working code
////////////          if (th.last_replies && th.last_replies.length>=threads[name][8][2]-threads[name][8][5]) {
////////////            update_thread(name, th);
//////////////            threads[name][21] = false;
//////////////            console.log('hit: '+name+', '+threads[name][8][2]+', '+threads[name][8][5]+', '+threads[name][8][0]+', '+threads[name][8][4]);
////////////          } else if (!th.last_replies) threads[name][21] = false;
//////////////          if (threads[name][21]) console.log('retrieve: '+name+', '+threads[name][8][2]+', '+threads[name][8][5]);
//////////// if (pref.test_mode['21']) threads[name][21] = false;
////////////        }
////////        }
////////}

////////        insert_footer3(name,th.flags,th.page,threads[name][17]);
//        insert_thread_idx(name);
//console.log(name+': '+threads[name][19][5]);
if (pref.test_mode['5']) {
        if (init_new && th.type_html!='catalog_html' && (type==='thread_html' || type==='page_html')) { // modify HTML at end because of DYNAMIC PARSE.
          trim_html(threads[name][0], th.domain, pref.catalog_format.show, th.key);
        }
}
        return reorder_thread_idx(name);
      }

      function get_watch_time_of_a_thread(name, time_of_op){
        var ret_time = get_mark_time(name,pref.catalog.filter.time_watch || pref.catalog.filter.time_watch_creation,true,true);
        if (!pref.catalog.filter.time_watch && pref.catalog.filter.time_watch_creation && ret_time>time_of_op) ret_time = 0;
        return ret_time;
      }

      function update_thread(name, th, tgt_th19){
        var tgt_th = threads[name];
////        var debug_str;
////        if (pref.debug_mode.unread_count===name) debug_str = ((tgt_th)? '8: ' + tgt_th[8].toString():'') + '\n19: ' + tgt_th[19].toString();
////        if (!th.CatChan_updated) { // patch for preventing from running twice.
////          th.CatChan_updated = true;
        var updated_tag = site2[th.domain].check_reply.check(th, tgt_th19);
////        }
//        if (pref.liveTag.from==='post') liveTag.extract_tags(th, name, tgt_th19); // move into 'check_reply.check'
//        if (pref.liveTag.from==='post' && tgt_th19[9].length!=0) { // working code.
//          liveTag.extract_tags(th, name, tgt_th19[9]);
//          tgt_th19[9] = null;
//        }
//                if (tgt_th[20]!==sb.pool.sticky) { // working code.
//                  site2[dbt[0]].add_sticky_info(tgt_th[0],tgt_th[18],sb.pool.sticky);
//                  tgt_th[20] = sb.pool.sticky;
//                }
        var updated = false;
        if (tgt_th) { // patch for parallel entry.
          if (tgt_th[8][4]<tgt_th19[3]) updated = true;
          tgt_th[8][4] = tgt_th19[3];
//if (pref.debug_mode['4']) console.log('update_thread: time: '+th.key+', '+tgt_th[8][4]);
//          if (th.type_data==='json') tgt_th[8][2] = tgt_th19[2];
          if (th.type_data==='json' && tgt_th[8][2]<tgt_th19[10]) tgt_th[8][2] = tgt_th19[10]; // 'page_html' can pass 'insert_thread_with_test'
          if (th.parse_funcs.has_nof_files && th.nof_files) tgt_th[8][3] = th.nof_files;
          update_thread_info(th, true);
//          if (tgt_th[23]) {
//            tgt_th[23] = false;
//            tgt_th[9] = catalog_filter_query(name);
//          }

//          tgt_th[21] = false; // CAUSE BUG. Each filter's tag must be prepared in advance at 'catalog_filter_query_scan', so 'update_thread' must precede 'catalog_filter_query_scan'.
                                //            tgt_th[21] is used to update thread's info, so tgt_th[21] must be cleared after 'insert_thread_with_test'.
                                //            To resolve this, almost of all descriptions to update thread info in 'insert_thread' must be moved to here.

          if (!tgt_th19[5] && tgt_th19[0]!==0) {
            if (tgt_th19[4] && tgt_th19[4].length!=0 && th.parse_funcs.add_op_img_url) th.parse_funcs.add_op_img_url(tgt_th19[4],th.board,th.domain);
            notifier.changed(name,threads);
          }
//          tgt_th19[5] = false;
//          tgt_th19[4] = null; // for GC.
          common_func.set_value_to_root(threads[name][19],'5',false); // patch
          if (updated) {
            tgt_th[9] = catalog_filter_query(th.key);
            reorder_thread_idx(name);
          }
        }
////        if (pref.debug_mode.unread_count===name) console.log(debug_str + '\n19: ' + tgt_th[19].toString() +'\n 8: '+((tgt_th)? tgt_th[8].toString():''));
        return (updated_tag)? 't' : (updated)? 'p' : false;
      }
      function update_thread_info(th, update_filter){
        var tgt_th = threads[th.key];
        if (tgt_th[23]) {
          for (var i in tgt_th[23]) {
            var flag = !(th.parse_funcs.missing_info && th.parse_funcs.missing_info[i]===null);
            if (update_filter && i==='time_posted' && flag) tgt_th[9] = catalog_filter_query(th.key);
            if (flag) delete tgt_th[23][i];
          }
          if (Object.keys(tgt_th[23]).length==0) tgt_th[23] = null;
        }
      }

////      function update_thread(name, th){ // working code.
////        var tgt_th = threads[name];
////          var debug_str;
////          if (pref.debug_mode.unread_count===name) debug_str = '8: ' + tgt_th[8].toString() + '\n19: ' + tgt_th[19].toString();
////              if (tgt_th) { // patch for parallel entry.
////                site2[th.domain].check_reply.check(th, tgt_th[19]);
////                tgt_th[8][4] = tgt_th[19][3];
////                tgt_th[8][2] = tgt_th[19][2];
////                if (th.parse_funcs.has_nof_files && th.nof_files) tgt_th[8][3] = th.nof_files;
////                if (pref.liveTag.from==='post' && tgt_th[19][9].length!=0) {
//////                  tgt_th[17][1] = liveTag.update_tags_in_th(tgt_th[19][9], tgt_th[17][1][0], tgt_th[17][0][1], pref.liveTag.max-tgt_th[17][0][0].length, name);
////                  liveTag.extract_tags(th, name, tgt_th[19][9]);
////                  tgt_th[19][9] = null;
//////                  if (pref.debug_mode['3']) console.log(tgt_th[17][1][0]);
////                }
////
//////                if (tgt_th[20]!==sb.pool.sticky) { // working code.
//////                  site2[dbt[0]].add_sticky_info(tgt_th[0],tgt_th[18],sb.pool.sticky);
//////                  tgt_th[20] = sb.pool.sticky;
//////                }
////                if (tgt_th[23]) {
////                  tgt_th[23] = false;
////                  tgt_th[9] = catalog_filter_query(name);
////                }
//////                if (pref.catalog_footer_show_nof_rep) site2[dbt[0]].insert_footer2(tgt_th[0],tgt_th[18],tgt_th[19],tgt_th[8]);
//////                if (update_footer && pref.catalog_footer_show_nof_rep) insert_footer3(name);
////                tgt_th[21] = false;
////                if (tgt_th[19][0]>=0) notifier.changed(name,threads);
////                tgt_th[19][5] = false;
////                tgt_th[19][4] = null; // for GC.
////                reorder_thread_idx(name);
//////var debug = '';
//////for (var d=0;d<10;d++) debug += threads_idx[d] + ', ';
//////console.log('ddd :'+debug);
//////              if (reorder_thread_idx(name)) {
//////                tgts = {};
//////                tgts[name] = true;
//////                show_catalog(tgts);
//////              }
////              }
////          if (pref.debug_mode.unread_count===name) console.log(debug_str + '\n19: ' + tgt_th[19].toString() +'\n 8: '+tgt_th[8].toString());
////      }

////////      function insert_thread(src, nickname, page_no, date_load, name, html_org, date, src2, url, from_native, th, type){
//////////console.log(th.key +', '+ th.time_bumped);
////////        var ch = threads[name];
////////        var init_new = false;
////////        if (ch==undefined) {
////////          init_new = true;
////////          if (th && th.exist) ch = th.pn; // native on base board
////////          else {
////////            if (from_native) ch = th.pn;
////////            else { // patch
////////              ch = document.createElement('div');
////////              ch.innerHTML = src.innerHTML; // re-making, sanitize was activated by this.
////////            }
////////          }
////////          ch.name = name;
//////////          if (from_native) th.init_func(ch);
//////////          if (from_native) site2[nickname].catalog_from_native_init_elem_func(ch);
////////          if (!embed_catalog || !from_native) {
////////            ch.style.width  = pref.catalog_size_width + 'px';
////////            ch.style.height = pref.catalog_size_height + 'px';
////////            ch.style.float = 'left';
////////            ch.style.overflow = 'hidden';
////////            ch.style.background = '#e5ecf9';
////////          }
////////          if (!ch.style) ch['style'] = {};
//////////          threads[name] = [ch, false, (from_native)? [catalog_triage_in, null] : [func_in, func_pop_up],
////////          threads[name] = [ch, (th && th.exist), (from_native && !th.posts)? [catalog_triage_in, null] : [func_in, func_pop_up],
////////                           [html_org, nickname],
////////                           (from_native)? src2 : null,
////////                           (from_native)? click_thread_native : click_thread, null, url, date, true,
////////                           null,
////////                           null, null, date_load, page_no, 0,
//////////                           (from_native && brwsr.ff)? th.init_func : null, // 16
////////                           null, // 16, NOT USED
////////                           src[brwsr.innerText].match(tags_scan_regex), // 17, tag
////////                           (from_native)? 'native' : 'page', // 18 html format type.
////////                           [0,0,0,0,null,false,-1, 0], 
////////                             // 19, time_of_checked, num_of_unread_replies_TO_ME, num_of_unread_replies,
////////                             //     time_of_checked_time_internal, args_for_desktop_notification, init,
////////                             //     time_of_checked_old, num_of_unread_old // for faster execution.
//////////                           null, // 20 sticky.
//////////                           (name in threads_last_deleted)? threads_last_deleted[name].sticky : null, // 20 sticky.
////////                           (name in threads_last_deleted)? threads_last_deleted[name].sticky : ('sticky' in th)? th.sticky : null, // 20 sticky.
//////////                           (nickname==='8chan' && from_native && pref.catalog.order.find_sage_in_8chan), // 21, watch.
////////                           false, // 21, watch.
////////                           {}, // 22, attr info for rollback.
////////                           null, // 23, for last post indexing.
////////                           null]; // 24, footer.
////////          if (name in threads_last_deleted) threads[name][8][4] = threads_last_deleted[name].last_post_time;
////////          catalog_attr_set(name,ch);
////////          ch.addEventListener('mouseover', threads[name][2][0], false);
////////          ch.addEventListener('click', threads[name][5], true);
////////          if (!from_native && pref.catalog_expand_at_initial) expand_shrink_thread(name);
////////          var dbt = cnst.name2domainboardthread(name,true);
////////          boards[dbt[0]+dbt[1]] = null;
//////////          var date_mark_1 = catalog_obj_merge(name,pref.catalog.filter.watch_list_obj2,null);
//////////          threads[name][19][0] = (date_mark_1.hit)? date_mark_1.time :
//////////                                ((pref.catalog.filter.time_watch && pref.catalog.filter.time_str!=='')? Date.parse(pref.catalog.filter.time_str) - pref.localtime_offset*3600000 : -1);
////////          threads[name][19][0] = get_mark_time(name,pref.catalog.filter.time_watch || pref.catalog.filter.time_watch_creation,false,true);
////////          if (!pref.catalog.filter.time_watch && pref.catalog.filter.time_watch_creation && threads[name][19][0]>date[1]) threads[name][19][0] = -1;// patch
////////          if (threads[name][19][0]>=0 && site2[nickname].time_revised_check(date[2])) threads[name][21] = true; // redundant???
////////          if (threads[name][19][0]<0  || threads[name][19][0]==threads[name][8][0]) threads[name][19][2] = threads[name][8][2];
//////////          ch.innerHTML = src.innerHTML;
//////////console.log(name+', '+threads[name][8]);
////////          if (threads[name][20]===true) site2[nickname].add_sticky_info(threads[name][0],threads[name][18],threads[name][20]); // first time only.
////////          threads[name][24] = prep_footer3(th.footer,th.board,th.domain,th.flags);
////////        } else {
////////          if (threads[name][19][0]<0) { // patch
////////            threads[name][19][0] = get_mark_time(name,pref.catalog.filter.time_watch,false,true);
////////            if (threads[name][19][0]>0) threads[name][19][2] = threads[name][8][2];
////////          }
//////////          for (var i=0;i<threads_idx.length;i++) if (threads_idx[i]==name) {threads_idx.splice(i,1);break;}
//////////          if (pref.notify.desktop.use && pref.notify.desktop.reply && threads[name][8][2]!=date[2]) desktop_notifier_obj.show('New Reples in '+name,name);
////////          ch = threads[name][0];
////////          if (!from_native) {
////////            ch.innerHTML = src.innerHTML; // faster, but can't revise footer.
//////////            threads[name][24] = prep_footer3(threads[name][0],th.board); // temporarily patch.
////////          }
//////////          ch.innerHTML = src.innerHTML; // revise footer.
//////////          if (threads[name][20]===true) site2[nickname].add_sticky_info(threads[name][0],threads[name][18],threads[name][20]);
////////        }
////////        if (threads[name][19][0]>date[0] && (date[4] && threads[name][19][0]>date[4])) threads[name][19][0] = -1;
////////        if (from_native && th.update_func) th.update_func(ch,th); // temporal
//////////        ch.innerHTML = src.innerHTML;
//////////        threads[name][3] = src1.innerHTML;
////////        threads[name][3][0] = html_org;
////////        if (!from_native) threads[name][4] = site2[nickname].thread2search_obj(src2);
//////////        if (!from_native) threads[name][4] = [src2[brwsr.innerText],'','','','','','',''];
//////////        threads[name][4] = src2[brwsr.innerText];
////////        if (!date[4]) date[4] = date[0]; // last post
////////        if (threads[name][8][4] && threads[name][8][4]>date[4]) date[4] = threads[name][8][4]; // last post
////////        threads[name][8] = date;
//////////        threads[name][8][4] = (from_native)? -1 : threads[name][8][0]; // last post
//////////        threads[name][23] = from_native; // for last post indexing.
////////        threads[name][23] = from_native && type!='page_html' && (!(name in threads_last_deleted) || threads_last_deleted[name].last_post_count!=threads[name][8][2]); // for last post indexing. // patch
////////        threads[name][9] = catalog_filter_query(name);
////////        if (!from_native) {
////////          if (threads[name][11]) threads[name][11] = remove_open_new_thread_event(threads[name][11]);
////////          threads[name][11] = add_open_new_thread_event(name,site2[nickname].modify_thread_link(ch));
////////        }
////////        threads[name][19][5] = init_new;
////////        if (threads[name][19][0]>=0) { // watching
////////          if (threads[name][8][2]-threads[name][19][2]>0) { // get new replies
////////            if (pref.catalog_footer_show_nof_rep || pref.notify.desktop.reply_to_me || pref.notify.desktop.reply) threads[name][21] = true;
//////////          } else if (pref.catalog_footer_show_nof_rep) site2[nickname].insert_footer2(threads[name][0],threads[name][18],threads[name][19],threads[name][8]);
////////          }
////////        }
////////        insert_footer3(threads[name][24],threads[name][19],threads[name][8],name,th.flags,th.page);
//////////        insert_thread_idx(name);
////////        return reorder_thread_idx(name, init_new);
////////      }
      function func_in(e){pop_up_delay(e,this.name);catalog_triage_in(this.name);}
      function func_pop_up(e){pop_up_delay(e,this.name);}
      function prep_footer3(footer,board,domain,flags){
//if (domain!=='KC') { // temporal
//if (domain==='8chan') { // temporal
//      th.footer.setAttribute('name',pref.script_prefix+'_footer');
//        if (pref.catalog_footer_show_board_name) {
////          footer.innerHTML = '<span name="'+pref.script_prefix+'_footer">' + footer.innerHTML +'</span>' + '&emsp;' + board;
//          footer.innerHTML = '<span>' + footer.innerHTML + '</span>' + '&emsp;' + board;
//          footer = footer.childNodes[0];
//        }
        var str = footer.innerHTML.replace(/ *R:[0-9 \/]*I:[0-9 \/]*/,'');
        str = str.replace(/P:[0-9 \/]*/,'');
        str = str.replace(/ *\(sticky\) */,'');
        if (str!=='') {
          footer.innerHTML = '<span>' + footer.innerHTML.substr(0,str.length) + '</span>' + str;
          footer = footer.childNodes[0];
        }
        if (pref.catalog_footer_br) {
          var footer_style = footer.getAttribute('style');
          footer_style = ((footer_style)? footer_style + ';' : '') + 'clear:both';
          footer.setAttribute('style',footer_style);
        }
        return [footer, flags];
//} else return null;
      }
      function insert_footer3(name,flags,page,tags, th){
        var footer = threads[name][24];
        var nums   = threads[name][19];
        var nums2  = threads[name][8];
if (footer) { // temporal
//        if (page===undefined || page===null || (page==='?' && footer[2])) page = footer[2];
        if (!page) page = footer[2] || '?';
        var str_add = ((pref.catalog_footer_show_nof_rep_to_me)? nums[1]+'/' : '' ) + nums[2];
        var str = (pref.catalog_footer_design==='native')?
                  ((pref.catalog_footer_show_nof_rep)? ((nums[0]!==0)? 'U: '+ str_add + ' / ' : ''):'') + 'R: '+(nums2[2]-1) + ' / I: '+nums2[3] + ((pref.catalog_footer_show_page)? ' / P: '+page : '')
                : ((pref.catalog_footer_show_nof_rep)? ((nums[0]!==0)? str_add + '/' : ''):'') + nums2[2] + '/'+nums2[3]+ ((pref.catalog_footer_show_page)? '/'+page : ''); // trial.
        if (str) str += '&emsp;';
        if (pref.catalog.footer.ctime || pref.catalog.footer.btime || pref.catalog.footer.ptime) {
          var date_string = new RegExp(new Date().toLocaleDateString(),'g');
          if (pref.catalog.footer.ctime) str += new Date(nums2[1]).toLocaleString().replace(date_string,'') + '&emsp;';
          if (pref.catalog.footer.btime && nums2[0]) str += new Date(nums2[0]).toLocaleString().replace(date_string,'') + '&emsp;';
          if (pref.catalog.footer.ptime && nums2[4]) str += new Date(nums2[4]).toLocaleString().replace(date_string,'') + '&emsp;';
        }
        if (pref.catalog_footer_show_board_name || pref.catalog_footer_show_thread_no || pref.catalog_footer_show_site_name) {
          var dbt = common_func.name2domainboardthread(name,true);
          str += ((pref.catalog_footer_show_site_name)? dbt[0] : '')
              + ((pref.catalog_footer_show_board_name)? dbt[1] : '')
              + ((pref.catalog_footer_show_thread_no)? dbt[2] : '');
        }
        footer[2] = page;

//        if (pref.catalog_footer_show_tag) { // working code.
//          var str_tags;
//          if (tags) {
//            var tags_count = tags[0][0].length;
//            str_tags = tags[0][2];
//            var i=0; 
//            while (tags_count<pref.liveTag.max && i<tags[1][0].length) {
//              if (tags[0][1][tags[1][0][i]]===undefined) {
//                str_tags += tags[1][0][i] + ', ';
//                tags_count++;
//              }
//              i++;
//            }
//            footer[3] = str_tags;
//          } else str_tags = footer[3] || '';
//          str += str_tags;
//        }

        footer[0].innerHTML = (pref.catalog_footer)? str : '';

        if (pref.catalog_footer_show_tag) {
          if (!footer[3]) {
            footer[3] = document.createElement('span');
            footer[3].innerHTML = '<span></span><span></span>';
          }
          if (tags) {
            for (var i=0;i<2;i++) {
              var pn = liveTag.update_tag_string(tags[i], ', ', liveTag.tag_node_onclick);
              footer[3].removeChild(footer[3].childNodes[i]);
              footer[3].insertBefore(pn,footer[3].childNodes[i] || null);
            }
          }
//          if (tags) { // working code.
//            for (var i=0;i<2;i++) {
//              if (!tags[i][2] || force_update) {
//                var pn = liveTag.update_tag_string(tags[i][0], ', ', liveTag.tag_node_onclick);
//                tags[i][2] = true;
//                footer[3].removeChild(footer[3].childNodes[i]);
//                footer[3].insertBefore(pn,footer[3].childNodes[i] || null);
//              }
//            }
//          }
          if (footer[3].parentNode!==footer[0]) footer[0].appendChild(footer[3]);
        }

        if (pref.catalog_footer_show_flag && (flags || footer[1]) && pref.catalog_footer) {
          if (!flags) flags = footer[1];
          var i = flags.length - pref.catalog_t2h_num_of_posts;
          if (i<1) i=1;
          if (flags[0]) footer[0].appendChild(flags[0]);
          while (i<flags.length) {
            if (flags[i]) footer[0].appendChild(flags[i]);
            i++;
          }
          if (th && site.nickname!==th.domain) site2[th.domain].absolute_link(footer[0], th.board); // patch
          footer[1] = flags;
        }
}
      }
      cataLog.insert_footer3 = insert_footer3;
////      function footer3_click_tag_entry(e){
////        footer3_click_tag(this.textContent, true);
////      }
//////      function footer3_click_tag(tag, from_tag){ // working code.
////////        var tag = this.textContent;
//////        footer3_click_tag_sub(tag, from_tag);
////////        liveTag.tag_in_thread_onclick(this,e);
////////        for (var name in liveTag.tags[tag].mems) {
////////          var dbt = common_func.name2domainboardthread(name,true);
////////          var tgt = liveTag.mems[dbt[0]][dbt[1]][dbt[2]];
////////          if (tgt[0][0].indexOf(tag)!=-1) tgt[0][2] = false;
////////          else tgt[1][2] = false;
////////          if (threads[name]) insert_footer3(name,undefined,undefined,threads[name][17]);
////////        }
////////        if (pref.liveTag.ci) if (liveTag.tags[tag].ci) for (var tag in liveTag.tags[tag].ci) footer3_click_tag_sub(tag); // can't track.
//////        if (pref.liveTag.ci) {
//////          var tag_l = tag.toLowerCase();
//////          for (var i in liveTag.tags) if (tag!==i && tag_l===liveTag.tags[i].key.toLowerCase()) footer3_click_tag_sub(i, from_tag);
//////        }
//////      }
////      function footer3_click_tag(tag, from_tag){
////        for (var i in liveTag.tags[tag].tgts) footer3_click_tag_sub(i, from_tag);
////      }
////      function footer3_click_tag_sub(tag, from_tag){
////        if (from_tag) liveTag.tag_in_thread_onclick(tag);
////        for (var name in liveTag.tags[tag].mems) {
////          var dbt = common_func.name2domainboardthread(name,true);
////          var tgt = liveTag.mems[dbt[0]][dbt[1]][dbt[2]];
////          if (tgt[0][0].indexOf(tag)!=-1) tgt[0][2] = false;
////          else tgt[1][2] = false;
////          if (threads[name]) insert_footer3(name,undefined,undefined,threads[name][17]);
////        }
////      }
      function update_all_footers(){
        for (var name in threads) insert_footer3(name);
      }
      function re_sort_thread(){
        var odl = [];
        for (var i=0;i<threads_idx.length;i++) if (threads_idx[i].substr(0,4)==='ODL:') odl[odl.length] = threads_idx[i];
        threads_idx=[];
        for (var i in threads) insert_thread_idx(i);
        for (var i=0;i<odl.length;i++) threads_idx[threads_idx.length] = odl[i];
        show_catalog();
      }
//      function reorder_threads_idx(names){
//        for (var i in names) reorder_thread_idx(i);
//      }
////      function reorder_thread_idx(name, skip_check){ // working code.
//////        for (var i=0;i<threads_idx.length;i++) if (threads_idx[i]==name) {threads_idx.splice(i,1);break;}
//////        insert_thread_idx(name);
////        var i;
////        if (!skip_check) {
////          i = 0;
////          while (i<threads_idx.length && threads_idx[i]!==name) i++;
////          if (i<threads_idx.length) threads_idx.splice(i,1);
////        } else i = -1;
////        return (i!=insert_thread_idx(name) || (threads[name] && threads[name][9][0]!=threads[name][1])); // returns need to redraw.
////      }
      function reorder_thread_idx(name){
        var i = threads_idx.indexOf(name);
        if (i!=-1) threads_idx.splice(i,1);
        return (i!=insert_thread_idx(name) || (threads[name] && threads[name][9][0]!=threads[name][1])); // returns need to redraw.
      }
      function insert_thread_idx(name){
        var indexing = pref.catalog.indexing;
        var date = threads[name][8][indexing] || threads[name][8][(indexing===0)?4:0];
        var ref=0;
        var end = threads_idx.length;
//console.log(name+', S: '+threads[name][19][1]+'/'+(threads[name][8][2]-threads[name][19][2])+', '+threads[name][8][2]+', '+threads[name][8][3]);
        if (pref.catalog.order.reply_to_me) {
          while (ref<end && threads_idx[ref].substr(0,4)!=='ODL:' && threads[threads_idx[ref]][19][0]!==0 && threads[threads_idx[ref]][19][1]!=0) ref++;
          if (threads[name][19][0]!==0 && threads[name][19][1]!=0) {end=ref;ref=0;}
//console.log(name+', M: '+ref+'/'+end+', '+threads[name][19][1]);
        }
        if (pref.catalog.order.reply) {
          var ref2 = ref;
//          while (ref2<end && threads_idx[ref2].substr(0,4)!=='ODL:' && threads[threads_idx[ref2]][19][2]!=threads[threads_idx[ref2]][8][2]) ref2++;
//          while (ref2<end && threads_idx[ref2].substr(0,4)!=='ODL:' && threads[threads_idx[ref2]][19][2]!=0 && threads[threads_idx[ref2]][19][2]!=threads[threads_idx[ref2]][8][2]) ref2++;
//          if (threads[name][19][2]!=0 && threads[name][19][2]!=threads[name][8][2]) end = ref2;
          while (ref2<end && threads_idx[ref2].substr(0,4)!=='ODL:' && threads[threads_idx[ref2]][19][0]!==0 && threads[threads_idx[ref2]][19][2]>0) ref2++;
          if (threads[name][19][0]!==0 && threads[name][19][2]>0) end = ref2;
          else ref = ref2;
//console.log(name+', N: '+ref+'/'+end+', '+(threads[name][8][2]-threads[name][19][2]));
        }
//        if (pref.catalog.order.watch) { // working code.
//          var ref2 = ref;
//          while (ref2<end && threads_idx[ref2].substr(0,4)!=='ODL:' && threads[threads_idx[ref2]][19][0]!==0) ref2++;
//          if (threads[name][19][0]!==0) end = ref2;
////          while (ref2<end && threads_idx[ref2].substr(0,4)!=='ODL:' && threads[threads_idx[ref2]][19][2]!=0) ref2++;
////          if (threads[name][19][2]!=0) end = ref2;
//          else ref = ref2;
////console.log(name+', R: '+ref+'/'+end);
//        }
        if (pref.catalog.order.watch!=='dont_care') { // working code.
          var polarity = (pref.catalog.order.watch==='last');
          var ref2 = ref;
          while (ref2<end && threads_idx[ref2].substr(0,4)!=='ODL:' && (polarity ^ threads[threads_idx[ref2]][19][0]!==0)) ref2++;
          if (polarity ^ threads[name][19][0]!==0) end = ref2;
          else ref = ref2;
//console.log(name+', R: '+ref+'/'+end);
        }
        if (pref.catalog.order.sticky!=='dont_care') {
          var polarity = (pref.catalog.order.sticky==='last');
          var ref2 = ref;
          while (ref2<end && threads_idx[ref2].substr(0,4)!=='ODL:' && (polarity ^ threads[threads_idx[ref2]][20])) ref2++;
          if (polarity ^ threads[name][20]) end = ref2;
          else ref = ref2;
//console.log(name+', T: '+ref+'/'+end);
        }
        while (ref<end && threads_idx[ref].substr(0,4)!=='ODL:' && date<=(threads[threads_idx[ref]][8][indexing] || threads[threads_idx[ref]][8][(indexing===0)?4:0])) ref++;
        if (ref==threads_idx.length) threads_idx.push(name);
        else threads_idx.splice(ref,0,name);
//console.log(name+', F: '+ref+'/'+end+', '+threads_idx.length);
        drawn_y = 0;
        if (ref<drawn_idx) drawn_idx = ref;
        return ref;
      }
      function expand_shrink_thread(name){
        if (threads[name][0].style.width=='') {
          if (pref.catalog_expand_with_hr && !embed_catalog) show_catalog_hr(name,'shrink');
          threads[name][0].style.width = pref.catalog_size_width + 'px';
          threads[name][0].style.height = pref.catalog_size_height + 'px';
        } else {
          threads[name][0].style.width = '';
          threads[name][0].style.height = '';
          if (pref.catalog_expand_with_hr && !embed_catalog) show_catalog_hr(name,'add');
        }
      }

      function click_thread_tn(e){
        if (pref.catalog_click==='none' && !embed_catalog) return;
        e.preventDefault();
        if (pref.catalog_click_area==='entire') return;
        var pn = this;
        while (!pn.name) pn = pn.parentNode;
        click_thread(pn.name);
      }
      function click_thread_whole(){
        if (pref.catalog_click_area==='entire') click_thread(this.name);
      }
      function click_thread(name){
        if (pref.catalog_click==='open' || embed_catalog) open_new_thread(threads[name][7], name);
        else if (threads[name][18]!=='catalog_html' && pref.catalog_click==='expand') expand_shrink_thread(name);
      }
//      function click_thread(name){
//        if (typeof(name)==='object') name= this.name;
//        var name = this.name;
//        if (pref.catalog_click=='expand') expand_shrink_thread(name);
//        else open_new_thread(threads[name][7], name);
//      }

      function add_open_new_thread_event(name,args){
        for (var i=0;i<args.length;i++) {
          var elem = args[i][0];
          var url  = args[i][1];
          var func = function(){open_new_thread(url, name);if (pref.catalog_click==='expand') expand_shrink_thread(name);};
          elem.addEventListener('click', func, false);
          args[i][1] = func;
        }
        return args;
      }
      function remove_open_new_thread_event(args){
        for (var i=0;i<args.length;i++) args[i][0].removeEventListener('click', args[i][1], false);
        return null;
      }
      function get_mark_time(name,time,list,watch){
        if (watch) {
          var date_mark = pref_func.merge_obj5(name,pref.catalog.filter.watch_list_obj2,{hit:false});
          if ('time' in date_mark) return date_mark.time;
        }
        if (list) {
          date_mark = pref_func.merge_obj5(name,pref.catalog.filter.list_obj2,{hit:false});
          if ('time' in date_mark) return date_mark.time;
          else if (date_mark.hit) return 0;
        }
        if (time && pref.catalog.filter.time_str!=='') return Date.parse(pref.catalog.filter.time_str);
        else return 0;
      }
//      function get_mark_time(name){
//        var date_mark = -1;
////        if (pref.catalog.filter.time_mark) date_mark = Date.parse(pref.catalog.filter.time_mark_str) - pref.localtime_offset*3600000;
//        if (pref.catalog.filter.time_mark) date_mark = Date.parse(pref.catalog.filter.time_str) - pref.localtime_offset*3600000;
//        if (pref.catalog.filter.list_mark_time) {
//          var time_list = catalog_filter_query_time_list(name)[1];
//          if (time_list) date_mark = time_list;
//        }
//        return date_mark;
//      }
      function open_new_thread(url, name){
//        if (url===null) url = site2[threads[name][16].dbt[0]].make_url3(threads[name][16].dbt[1], threads[name][16].dbt[2], '0'); // temporal
        if (url===null) url = site2[threads[name][16].dbt[0]].make_url4(common_func.name2dbt(name))[0]; // temporal
        if (typeof(url)==='string') url = [url];
        var idx = 0;
        var unread50 = (threads[name][19][0]!==0 && threads[name][19][2]<=50);
        if      (pref.catalog_open_last50==='no')    idx = 0;
        else if (pref.catalog_open_last50==='exist') idx = url.length-1;
        else if (pref.catalog_open_last50==='exist_watch') idx = (unread50)? url.length-1 : 0;
        else {
          var dbt = common_func.fullname2dbt(name); // patch
if (dbt[0]==='8chan' || dbt[0]==='lain') { // patch.
          if (url.length==1 && threads[name][8][2]>100) url[1] = url[0].replace(/.html/,'+50.html');
          if (pref.catalog_open_last50==='speculative') idx = (threads[name][8][2]>100)? url.length-1 : 0;
          else if (pref.catalog_open_last50==='spec_watch') idx = (unread50)? url.length-1 : 0;
}
        }
        url = url[idx];

//console.log(url);
//        var cw = window.open(url,(pref.catalog_open_in_new_tab)? '_blank' : '_self');
        var window_name = (site.embed_frame_win)? site.embed_frame
                        : (pref.catalog_open_where==='named')? name : pref.catalog_open_where;
//                        : (pref.catalog_open_in_new_tab)? ((pref.catalog_use_named_window)? name : '_blank') : '_self';
        var cw = window.open(url,window_name);
//        var time_marked = get_mark_time(name,pref.catalog.filter.time_mark,pref.catalog.filter.list_mark_time,pref.catalog.filter.watch_list_mark_time);
//        if (time_marked===0 && pref.liveTag.use) time_marked = liveTag.mems.getFromName(name)[2][0];
        var time_marked = liveTag.mems.getFromName(name)[2][0];
        send_message(window_name, [['MARK',time_marked]],cw);
        if (pref.catalog.auto_watch) triage_exe_0(name,'WATCH','',true);
      }
      function mark_read_thread(name,read){
        if (read) {
//          threads[name][19][0] = threads[name][8][0];
//          threads[name][19][0] = (threads[name][8][0]>threads[name][8][4])? threads[name][8][0] : threads[name][8][4];
          threads[name][19][0] = -(threads[name][8][4]||threads[name][8][0]);
        } else {
          threads[name][19][0] = 0;
//          threads[name][19][6] = -2;
        }
        threads[name][19][1] = 0;
        threads[name][19][2] = 0;
        if (pref.liveTag.style) liveTag.update_ur(name,0,true);
//        site2[cnst.name2domainboardthread(name,true)[0]].insert_footer2(threads[name][0],threads[name][18],threads[name][19],threads[name][8]);
        insert_footer3(name);
//        if (reorder_thread_idx(name)) show_catalog(name); // called in triage_exe
        if (pref.notify.favicon) notifier.favicon.set(threads);
      }

      var drawn_idx = 0;
      var drawn_y = 0;
      var drawn_ref_count = 0;
      function show_catalog_cont(){
        if (drawn_idx!==true) show_catalog();
      }
      function show_catalog(tgts_in,sound){
        var ref_height;
        if (pref.catalog_draw_on_demand) {
          ref_height = (embed_catalog || embed_page)? brwsr.document_body.scrollTop + window.innerHeight*1.5
                     : triage_parent.scrollTop + triage_parent.clientHeight*1.5;
          if (drawn_idx!==0 && drawn_y>=ref_height) return;
        }
        var tgts;
        if (typeof(tgts_in)==='string') {
          tgts = {};
          tgts[tgts_in] = null;
//        } else if (Array.isArray(tgts_in)) {
//          tgts = {};
//          for (var i=0;i<tgts_in.length;i++) tgts[tgts_in[i]] = null;
        } else tgts = tgts_in;
//        if (embed_catalog) {show_catalog_native();return;}
//        if (tgts) for (var name in tgts) if (threads[name] && threads[name][0].parentNode) threads[name][0].parentNode.removeChild(threads[name][0]); // this is required when the thread is moved to later. // THIS CAUSES A BLINK.
        catalog_triage_out();
        pref_func.tooltips.hide();
        var catalog_expand_with_hr = pref.catalog_expand_with_hr && !embed_catalog;
        var ref_count;
        if (!pref.catalog_draw_on_demand || drawn_idx===0 || tgts!==undefined) {
          drawn_y = 0;
          ref_count = 0;
          if (triage_parent.firstChild && triage_parent.firstChild.tagName==='INPUT') ref_count++; // patch for vichan's index.
          if (catalog_expand_with_hr) ref_count = show_catalog_skip_hs(ref_count);
        } else ref_count = drawn_ref_count;
        var load_tgt = '';
//        var appeared = [];
//var debug = '';
//for (var d=0;d<threads_idx.length;d++) if (threads_idx[d]!=='ODL:' && threads[threads_idx[d]][9][0]) debug += threads_idx[d] + ', ';
//console.log(debug);
        var i = (pref.catalog_draw_on_demand && drawn_idx!==true)? drawn_idx : 0;
        while (i<threads_idx.length) {
//console.log(drawn_y+', '+triage_parent.scrollTop+', '+triage_parent.clientHeight*1.5+', '+ref_height);
            if (pref.catalog_draw_on_demand && drawn_y>=ref_height) break;
            if (tgts==='END') break;
            var name = threads_idx[i];
            if (name.substr(0,4)==='ODL:') {
              if (load_tgt==='') {
                load_tgt = name;
if (!pref.test_mode['15']) {
                if (load_on_demand.call([load_tgt.substr(4)])) threads_idx.splice(i--,1);
                break;
} else {
                threads_idx.splice(i--,1);
}
              }
            } else {
              var ch = threads[name][0];
              if (tgts===undefined || name in tgts || (pref.catalog_draw_on_demand && threads[name][9][0])) {
                if (threads[name][9][0]) {
////                  if (tgts!==undefined) { // working code.
////                    ref_count = 0;
////                    for (var j=0;j<i;j++) if (threads_idx[j].substr(0,4)!=='ODL:' && threads[threads_idx[j]][1]) ref_count++;
////                  }
////                  if (catalog_expand_with_hr) {
////                    var j = 0;
////                    var j_max = triage_parent.childNodes.length;
////                    while (j<=ref_count && j<j_max) if (triage_parent.childNodes[j++].tagName!=='DIV') ref_count++;
////                  }
                  var ref;
                  if (tgts!==undefined) {
                    var j=i-1;
                    while (j>=0 && (threads_idx[j].substr(0,4)==='ODL:' || !threads[threads_idx[j]][1])) j--;
                    if (j>=0) {
                      ref = threads[threads_idx[j]][0].nextSibling;
                      if (catalog_expand_with_hr && ref) ref = ref.nextSibling;
                    } else ref = triage_parent.firstChild;
                    delete tgts[name];
                    if (Object.keys(tgts).length===0) tgts='END';
                  } else ref = triage_parent.childNodes[ref_count];
                  if (ref!==threads[name][0] || !threads[name][1]) {
                    if (catalog_expand_with_hr && threads[name][1]) show_catalog_hr(name,'remove');
                    triage_parent.insertBefore(ch,(ref && ref.parentNode===triage_parent)? ref : null); // if threads are removed much, ref refers horizontal splitter.
                    if (catalog_expand_with_hr) show_catalog_hr(name,'add');
                    threads[name][1] = true;
                  }
                  if (threads[name][1]) {
                    if (pref.catalog_draw_on_demand) drawn_y = ch.offsetTop; // for faster execution. DOM function is too heavy.
                    ref_count++;
                    if (catalog_expand_with_hr) ref_count = show_catalog_skip_hs(ref_count);
                  }
                  var nickname = name.replace(/\/.*/,'');
                  if (pref.catalog.filter.list_mark_time && threads[name][9][1]) site2[nickname].mark_newer_posts(ch,threads[name][9][1]);
////                  if (!threads[name][1]) { // working code.
////                    threads[name][1] = true;
//////                    threads[name][11] = add_open_new_thread_event(name,site2[nickname].modify_thread_link(ch));
//////                    console.log(ch.offsetTop +', ' + i + ', ' + name);
////                    appeared.push(name);
//////                    if (sound && pref.notify.sound.notify) notifier.sound.play();
////                  }
                } else if (threads[name][1] && !threads[name][9][0]) {
                  if (pop_up_status[name]) pop_down_event(name);
//                  threads[name][11] = remove_open_new_thread_event(threads[name][11]);
                  if (catalog_expand_with_hr) show_catalog_hr(name,'remove');
                  triage_parent.removeChild(ch);
                  threads[name][1] = false;
                }
// BUG
//              } else {
////                var ref = triage_parent.childNodes[ref_count];
////                for (var name in tgts) if (threads[name] && ref===threads[name][0]) {ref.parentNode.removeChild(ref);break;} // this is required when the thread is moved to later. // threads[name] may not exist when it is snoop, that contains redundant threads.
//                while (1) {
//                  var flag = true;
//                  var ref2 = triage_parent.childNodes[ref_count];
//                  for (var name2 in tgts) if (threads[name2] && ref2===threads[name2][0]) {
//                    ref2.parentNode.removeChild(ref2);
//                    flag=false;
//                    break;
//                  } // this is required when the thread is moved to later. // threads[name] may not exist when it is snoop, that contains redundant threads.
//                  if (flag) break;
//                }
//                if (threads[name][9][0]) ref_count++; // name must proceed by the count of eliminated in above.  THIS IS A BUG.
// BUG
              }
            }
            i++;
        }
        drawn_idx = (i==threads_idx.length)? true : i;
        drawn_ref_count = ref_count;
//        if (appeared.length!=0 && sound) notifier.appeared(appeared,threads);
if (pref.test_mode['15']) {
        if (load_tgt!=='') 
          if (load_list.ondemand.mutex) {
            load_list.ondemand.idx  = 0;
            load_list.ondemand.tgts = [load_tgt.substr(4)];
            get_page(load_list.ondemand);
          } else threads_idx.unshift(load_tgt); // BUG. MUST INSERT IT TO THE PLACE WHERE IT WAS.
}
//var str_debug = '';
//for (var d=0;d<threads_idx.length;d++) if (threads[threads_idx[d]][1] && threads[threads_idx[d]][9][0]) str_debug += threads_idx[d] + threads[threads_idx[d]][8][pref.catalog.indexing] + ',';
//console.log(str_debug);
////        if (catalog_expand_with_hr)
////          for (var i=triage_parent.childNodes.length-2;i>=0;i--)
////            if (triage_parent.childNodes[i].tagName==='HR' && triage_parent.childNodes[i+1].tagName==='HR') triage_parent.removeChild(triage_parent.childNodes[i+1]);
      }
      scroll_event_src.addEventListener('scroll', show_catalog_cont, false);

      var load_on_demand = (function(){
        var mutex = true;
        return {
          call: function(tgts){
            if (this.get()) {
              scan_boards.scan_init('on_demand_load', tgts, {refresh:true, crawler_max:1, callback:load_on_demand.release_draw});
              return true;
            } else return false;
          },
          release: function(){mutex = true;},
          release_draw: function(){load_on_demand.release();show_catalog();},
          get: function(){
            var retval = mutex;
            mutex = false;
            return retval;
          }
        }
      })();

      function show_catalog_skip_hs(ref_count){
        var c_len = triage_parent.childNodes.length;
        var class_hs = pref.script_prefix+'_hs';
//        while (ref_count<c_len && triage_parent.childNodes[ref_count].className===class_hs) ref_count++;
        if (ref_count<c_len && triage_parent.childNodes[ref_count].className===class_hs) ref_count++;
        return ref_count;
      }
      function show_catalog_hr(name,func){
        if (embed_catalog) return;
        var pn = threads[name][0];
        var class_hs = pref.script_prefix+'_hs';
        if (func==='add' && pn.style.width==='' && pn.style.height==='') {
          if (pn.previousSibling && pn.previousSibling.className!==class_hs) pn.parentNode.insertBefore(site2[site.nickname].horizontal_separator_in_index(),pn);
          if (pn.nextSibling && pn.nextSibling.className!==class_hs) pn.parentNode.insertBefore(site2[site.nickname].horizontal_separator_in_index(),pn.nextSibling);
        }
        if (func==='shrink' || func==='remove' && pn.style.width==='' && pn.style.height==='' || func==='add' && (pn.style.width!=='' || pn.style.height!=='')) {
          var pn_test = (pn.previousSibling && pn.previousSibling.className===class_hs)? pn.previousSibling.previousSibling : null;
          if (pn_test && (pn_test.style.width!=='' || pn_test.style.height!=='')) pn.parentNode.removeChild(pn.previousSibling);
          var pn_test = (pn.nextSibling && pn.nextSibling.className===class_hs)? pn.nextSibling.nextSibling : null;
          if (pn_test && (pn_test.style.width!=='' || pn_test.style.height!=='')) pn.parentNode.removeChild(pn.nextSibling);
        }
        if (func==='remove') {
          if (pn.previousSibling && pn.previousSibling.className===class_hs && pn.nextSibling && pn.nextSibling.className===class_hs) pn.parentNode.removeChild(pn.previousSibling);
          if (pn.nextSibling && pn.nextSibling.className===class_hs && pn.nextSibling.nextSibling && pn.nextSibling.nextSibling.className===class_hs) pn.parentNode.removeChild(pn.nextSibling);
        }
      }

////      function show_catalog_hr(name,func){ // working code.
////        var pn = threads[name][0];
//////        var sibls = ['previousSibling', 'nextSibling'];
//////        if (pn.style.width==='' && pn.style.height==='') {
//////          for (var i=0;i<sibls.length;i++)
//////            while (pn[sibls[i]] && pn[sibls[i]].tagName==='HR' && pn[sibls[i]][sibls[i]].tagName==='HR') pn.parentNode.removeChild(pn[sibls[i]]);
////        if (func==='add' && pn.style.width==='' && pn.style.height==='') {
////          if (pn.previousSibling && pn.previousSibling.tagName!=='HR') pn.parentNode.insertBefore(document.createElement('hr'),pn);
////          if (pn.nextSibling && pn.nextSibling.tagName!=='HR') pn.parentNode.insertBefore(document.createElement('hr'),pn.nextSibling);
////        }
////        if (func==='shrink' || func==='remove' && pn.style.width==='' && pn.style.height==='' || func==='add' && (pn.style.width!=='' || pn.style.height!=='')) {
////          var pn_test = (pn.previousSibling && pn.previousSibling.tagName==='HR')? pn.previousSibling.previousSibling : null;
////          if (pn_test && (pn_test.style.width!=='' || pn_test.style.height!=='')) pn.parentNode.removeChild(pn.previousSibling);
////          var pn_test = (pn.nextSibling && pn.nextSibling.tagName==='HR')? pn.nextSibling.nextSibling : null;
////          if (pn_test && (pn_test.style.width!=='' || pn_test.style.height!=='')) pn.parentNode.removeChild(pn.nextSibling);
////        }
////        if (func==='remove') {
////          if (pn.previousSibling && pn.previousSibling.tagName==='HR' && pn.nextSibling && pn.nextSibling.tagName==='HR') pn.parentNode.removeChild(pn.previousSibling);
//////          for (var i=0;i<sibls.length;i++) {
//////            var pn_test = pn[sibls[i]][sibls[i]];
//////            if (pn_test.tagName==='DIV' && pn_test.style && (pn_test.style.width!=='' || pn_test.style.height!=='')) pn.parentNode.removeChild(pn[sibls[i]]);
//////          }
////        }
////      }

      function catalog_attr_set(name,pn){
        var val = null;
        if (pref.catalog.filter.attr_list) {
          if (pref.catalog.style_general_list) val = pref_func.merge_obj5(name,pref.catalog.style_general_list_obj2,val);
          if (pref.catalog.filter.attr_list)   val = pref_func.merge_obj5(name,pref.catalog.filter.attr_list_obj2,val);
        }
//        if (val && val.style) {
////          var styles = val.style.split(';');
////          for (var i=0;i<styles.length;i++) {
////            var stl = styles[i].split(':');
////            pn.style[stl[0]] = stl[1];
////          }
////console.log('catalog_attr_set :'+name+', '+val.toSource());
////          for (var stl in val)
////            if (stl.indexOf('style')==0) pn.style[stl.substr(6)] = val[stl];
////          for (var stl in val) {
////            if (stl.indexOf('style')==0 && stl.length>6) pn.style[stl.substr(6)] = val[stl];
////            if (stl.indexOf('style')==0 && stl.length>6) {
////              pn.setAttribute('style',pn.getAttribute('style')+stl.substr(6)+':'+val[stl]+';');
////              console.log('catalog_attr_set_1 :'+name+', '+pn.getAttribute('style')+';'+stl.substr(6)+val[stl]+':');
////            }
////          }
//          for (var stl in val.style) pn.style[stl] = val.style[stl];
//        }
        var rollback_info = threads[name][22];
        if (val && val.style) {
          for (var stl in val.style) {
            if (!(stl in rollback_info)) rollback_info[stl] = pn.style[stl];
            pn.style[stl] = val.style[stl];
          }
        }
        for (var stl in rollback_info) {
          if (!val || !val.style || !(stl in val.style)) {
            if (rollback_info[stl]===undefined) delete pn.style[stl];
            else pn.style[stl] = rollback_info[stl];
            delete rollback_info[stl];
          }
        }
        if (val && val.cmd) {
          for (var c in val.cmd) {
            if (c==='sticky') {
              if (val.cmd[c] && !threads[name][20]) {
                threads[name][16].sticky_icon = site2[site.nickname].add_sticky_info(threads[name][0],threads[name][16].type_html);
                threads[name][20] = true;
              } else if (!val.cmd[c] && threads[name][20]) {
                var icon = threads[name][16].sticky_icon;
                if (icon) icon.parentNode.removeChild(icon);
                threads[name][16].sticky_icon = null;
                threads[name][20] = false;
              }
            }
          }
        }
      }
    
////      function catalog_obj_merge(name,obj,val){
////        var dbt = cnst.name2domainboardthread(name,true);
////        if (val===null) val = {hit:false};
////        val = catalog_obj_merge_1(val,obj,'DEFAULT');
////        val = catalog_obj_merge_1(val,obj,dbt[0]); // domain
////        val = catalog_obj_merge_1(val,obj,dbt[1]); // board
////        val = catalog_obj_merge_1(val,obj,dbt[0]+dbt[1]); // domain+board
////        val = catalog_obj_merge_1(val,obj,dbt[2]); // thread
////        val = catalog_obj_merge_1(val,obj,dbt[0]+dbt[2]); // domain+thread
////        val = catalog_obj_merge_1(val,obj,dbt[1]+dbt[2]); // board+thread
////        val = catalog_obj_merge_1(val,obj,name);
////        return val;
////      }
////      function catalog_obj_merge_1(val,obj,key){
////        if (obj[key]) {
////          for (var i in obj[key])
//////            if (val[i]===undefined || typeof(obj[key][i])!=='object') val[i] = obj[key][i];
//////            else for (var j in obj[key][i]) val[i][j] = obj[key][i][j]; // 2nd level.
////            if (typeof(obj[key][i])!=='object') val[i] = obj[key][i];
////            else {
////              if (val[i]===undefined) val[i]={};
////              for (var j in obj[key][i]) val[i][j] = obj[key][i][j]; // 2nd level.
////            }
////          val.hit = true;
////        }
////        return val;
////      }

      function filter_kwd_prep(kwd, init) {
        var kwds = kwd.str.split(' ');
        for (var i=kwds.length-1;i>=0;i--) {
          if (kwds[i]==='') kwds.splice(i,1);
          else {
            if (!kwd.re) kwds[i] = kwds[i].replace(/[\.\(\)\[\]\+\?\^\$\{\}]/g,'\\$&').replace(/\*/g,'.*');
            kwds[i] = new RegExp(kwds[i],(kwd.ci)? 'i' : '');
          }
        }
        kwd.kwds = kwds;
        if (!init && kwd.use) catalog_filter_changed();
      }
// pref.catalog.filter.kwd: {use:true, op:true, posts:false, sub:true, name:true, trip:true, com:true, file:true, re:false, ci:true, match:true, str:'', kwds:[]}
//                     posts: [sub:null, com:null, name:null, trip:null, filename:null]
      function catalog_filter_query_keyword(kwd,posts){
        if (!kwd.use || kwd.kwds.length==0) return true;
        var post_array = Array.isArray(posts);
        var start = (!post_array || kwd.op)? 0 : 1; // temporarily
        var end   = ( post_array && kwd.post)? posts.length : 1; // tamporarily
//        var retval = kwd.match==='match' || kwd.match==='match_any';
//        if (kwd.match==='match' || kwd.match==='unmatch') { // all
        var retval = kwd.match<2;
        if (kwd.match%2===0) { // all
          for (var i=0;i<kwd.kwds.length;i++) if (retval!==query_1()) return false;
          return true;
        } else {
          for (var i=0;i<kwd.kwds.length;i++) if (retval===query_1()) return true;
          return false;
        }

        function query_1(){
          for (var j=start;j<end;j++) {
            var pst = (post_array)? posts[j] : (j==0)? posts : null;
            if (pst) { // if posts are not exist, th.posts becomes 'undefined'.
              if (kwd.sub)  if (pst.sub  && kwd.kwds[i].test(pst.sub )) return true;
              if (kwd.com)  if (pst.com  && kwd.kwds[i].test(pst.com )) return true;
              if (kwd.name) if (pst.name && kwd.kwds[i].test(pst.name)) return true;
              if (kwd.trip) if (pst.trip && kwd.kwds[i].test(pst.trip)) return true;
              if (kwd.file) {
                if (pst.filename && kwd.kwds[i].test(pst.filename)) return true;
                if (pst.extra_files)
                  for (var k=pst.extra_files.length-1;k>=0;k--) 
                    if (pst.extra_files[k].filename && kwd.kwds[i].test(pst.extra_files[k].filename)) return true;
              }
            }
          }
          return false;
        }
//        for (var i=0;i<kwd.kwds.length;i++) { // OR
//          for (var j=start;j<end;j++) {
//            var pst = (post_array)? posts[j] : (j==0)? posts : null;
//            if (pst!==null) {
//              if (kwd.sub)  if (pst.sub  && kwd.kwds[i].test(pst.sub )) return retval;
//              if (kwd.com)  if (pst.com  && kwd.kwds[i].test(pst.com )) return retval;
//              if (kwd.name) if (pst.name && kwd.kwds[i].test(pst.name)) return retval;
//              if (kwd.trip) if (pst.trip && kwd.kwds[i].test(pst.trip)) return retval;
//              if (kwd.file) {
//                if (pst.filename && kwd.kwds[i].test(pst.filename)) return retval;
//                if (pst.extra_files)
//                  for (var k=pst.extra_files.length-1;k>=0;k--) 
//                    if (pst.extra_files[k].filename && kwd.kwds[i].test(pst.extra_files[k].filename)) return retval;
//              }
//            }
//          }
//        }
//        return !retval;
      }
//      function catalog_filter_query_keyword(str_in){
//        if (!pref.catalog.filter.kwd.use) return true;
//        var kwd = pref.catalog.filter.kwd.str;
//        if (kwd==='') return true;
//        var str = ((pref.catalog.filter.kwd.op       )? str_in[0]+'\n' : '')
//                + ((pref.catalog.filter.kwd.op_sub   )? str_in[1]+'\n' : '')
//                + ((pref.catalog.filter.kwd.op_name  )? str_in[2]+'\n' : '')
//                + ((pref.catalog.filter.kwd.op_file  )? str_in[3]+'\n' : '')
//                + ((pref.catalog.filter.kwd.post     )? str_in[4]+'\n' : '')
//                + ((pref.catalog.filter.kwd.post_sub )? str_in[5]+'\n' : '')
//                + ((pref.catalog.filter.kwd.post_name)? str_in[6]+'\n' : '')
//                + ((pref.catalog.filter.kwd.post_file)? str_in[7]+'\n' : '');
//        if (str==='') return true;
//
//        var flag = true;
//        var kwds = kwd.split(' ');
//        for (var i=0;i<kwds.length;i++) {
//          if (kwds[i]==='') continue;
//          kwd = kwds[i];
//          if (!pref.catalog.filter.kwd.re) kwd = kwd.replace(/[\.\(\)\[\]\+\?\^\$\{\}]/g,'\\$&').replace(/\*/g,'.*');
//          if (pref.catalog.filter.kwd.ci) kwd = new RegExp(kwd,'i');
//          var result = (str.search(kwd)!=-1);
//          if (pref.catalog.filter.kwd.match==='unmatch') result = !result;
//          flag = flag & result;
//        }
//        return flag;
//      }
      function catalog_filter_query_tag(tags){
//        if (!pref.catalog.filter.tag || filter_tags.length==0) return true;
        if (!pref.catalog.filter.tag) return true;
if (pref.test_mode['22']) {
        if (filter_tags.length==0) return false;
        if (!tags) return false;
//console.log(tags);
        for (var i=0;i<tags.length;i++)
          for (var j=0;j<filter_tags.length;j++)
            if (tags[i].search(filter_tags[j])!=-1) return true;
        return false;
} else {
        return liveTag.search_by_tags(tags);
}
      }
      function catalog_filter_query(name){
        var val_old = threads[name][9];
        var val = catalog_filter_query_1(name);
        if (val_old[0] !== val[0]) drawn_idx = 0;
        return val;
      }
      function catalog_filter_query_1(name){
        if (!catalog_filter_query_keyword(pref.catalog.filter.kwd, threads[name][4])) return [false];
//        if (!catalog_filter_query_keyword(threads[name][4])) return [false];
//        var kwd = pref.catalog.filter.kwd.str;
//        if (pref.catalog.filter.kwd && kwd!=='') {
//          if (!pref.catalog.filter.kwd.re) kwd = kwd.replace(/\*/g,'.*');
//          if (pref.catalog.filter.kwd.ci) kwd = new RegExp(kwd,'i');
//          var str = threads[name][4];
//          var result = (str.search(kwd)!=-1);
//          var match = (pref.catalog.filter.kwd.match==='match');
//          if ((match && !result) || (!match && result)) return [false];
//        }
//        if (pref.catalog.filter.tag) {
//          var pn_tag_list = pn_filter.getElementsByTagName('div')['catalog.filter.tag_list'];
//          var cbxes = pn_tag_list.getElementsByTagName('input');
//          var tags = '';
//          for (var i=0;i<cbxes.length;i++)
//            if (cbxes[i].checked) tags = tags + cbxes[i].nextSibling.textContent.replace(/ [0-9]*: /,'').replace(/$/,'(#|,| |\.|:|;|\n|$)') + '|'; // ATTENTION. DESCRIPTION IS ALSO EXIST IN SCAN_TAGS().
//          if (tags!=='') {
//            tags = tags.replace(/\|$/,'');
//            if (pref.catalog.filter.tag_ci) tags = new RegExp(tags,'i');
//            var str = threads[name][0][brwsr.innerText];
//            if (str.search(tags)==-1) return [false];
//          }
//        }
if (pref.test_mode['22']) {
        if (!catalog_filter_query_tag(threads[name][17])) return [false];
} else {
//        if (!catalog_filter_query_tag((threads[name][17])? threads[name][17][0][0].concat(threads[name][17][1][0]) : '')) return [false];
        if (pref.catalog.filter.tag) if (!liveTag.search_by_tags(threads[name][17])) return [false];
}
//        if (pref.catalog.filter.tag && filter_tags.length!=0) {
//          var str = threads[name][17];
//          if (!str) return [false];
//          else {
//            var flag = false;
//            for (var i=0;i<str.length;i++)
//              for (var j=0;j<filter_tags.length;j++)
//                if (str[i].search(filter_tags[j])!=-1) {flag = true; break;}
//            if (!flag) return [false];
//          }
//        }
        if (pref.catalog.filter.time) {
          var time = Date.parse(pref.catalog.filter.time_str);
//          if (threads[name][8][0]<=time && threads[name][8][4]<=time) return [false];
          if ((threads[name][8][4]||threads[name][8][0])<=time) return [false];
        }
        if (pref.catalog.filter.list || pref.catalog.filter.list_mark_time) return catalog_filter_query_time_list(name);
//        else if (pref.catalog.filter.list_mark_time) [true, get_mark_time(name)];
        else return [true];
      }
      cataLog.catalog_filter_query = catalog_filter_query;
      function catalog_filter_query_scan(posts,tags){
        if (!catalog_filter_query_keyword(pref.catalog.filter.kwd, posts)) return false;
//        if (!catalog_filter_query_keyword(str)) return false;
if (pref.test_mode['22']) {
        if (!catalog_filter_query_tag(tags)) return false;
} else {
//        if (!catalog_filter_query_tag(tags[0][0].concat(tags[1][0]))) return false;
        if (pref.catalog.filter.tag) if (!liveTag.search_by_tags(tags)) return false;
}
        return true;
      }
      function catalog_filter_query_time_list(name){
        var val = pref_func.merge_obj5(name,pref.catalog.filter.list_obj2,{hit:false});
//        if (val.time) return [(!pref.catalog.filter.list || val.time<threads[name][8][0] || val.time<threads[name][8][4]), val.time]; // hit always.
        if (val.time) return [(!pref.catalog.filter.list || val.time<(threads[name][8][4]||threads[name][8][0])), val.time]; // hit always.
        else if (val.hit) return [!pref.catalog.filter.list];

//          if (pref.catalog.filter.list_obj[1]) // working code
//            for (var j=1;j<pref.catalog.filter.list_obj.length;j++) {
//              var dn_bl = pref.catalog_board_list_obj[board_sel.selectedIndex][0]['domain'];
//              var bn_bl = pref.catalog_board_list_obj[board_sel.selectedIndex][0]['board'];
//              for (var i=0;i<pref.catalog.filter.list_obj[j].length;i++) {
//                var key = pref.catalog.filter.list_obj[j][i]['key'];
//                if (name == key) {retval = false;break;} // for faster execution.
//                var time;
//                if (key.indexOf('@')!=-1) {
//                  time = Date.parse(key.replace(/[^@]*@/,'')) - pref.localtime_offset*3600000;
//                  key = key.replace(/@.*/,'');
//                } else time = false;
//                var dn_key = (key.indexOf('/')==-1)? dn_bl : key.replace(/\/.*/,'');
//                if (dn_key=='') dn_key = dn_bl;
//                var bn_key = (key.indexOf('/')==-1)? bn_bl : key.replace(/[^\/]*\//,'/').replace(/\/[^\/]*$/,'/');
//                if (bn_key=='/') bn_key = bn_bl;
//                var tn_key = key.replace(/[^\/]*\//g,'')
//                var dn_name = name.replace(/\/.*/,'');
//                var bn_name = name.replace(/[^\/]*\//,'/').replace(/\/[^\/]*$/,'/');
//                var tn_name = name.replace(/[^\/]*\//g,'')
//                if (dn_name==dn_key && bn_name==bn_key && tn_key==tn_name) {
//                  if (time===false || time>=threads[name][8][0]) {retval = false; break;}
//                  else {retval = time; break;}
//                }
//              }
//            }
        return [true];
      }
      function catalog_filter_changed(){
//console.log('called');
        if (pref.catalog.filter.kwd.use || pref.catalog.filter.tag || pref.catalog.filter.time || pref.catalog.filter.list) for (var th in threads) threads[th][9] = catalog_filter_query(th);
//        if (pref.catalog.filter.kwd || pref.catalog.filter.time || pref.catalog.filter.list || pref.catalog.filter.list_mark_time) for (var th in threads) threads[th][9] = catalog_filter_query(th); // cause error.
        else for (var th in threads) threads[th][9] = [true];
        drawn_idx = 0;
        show_catalog();
//console.log('filter_changed');
//        catalog_refresh_gather_info(); // cut at 2015.05.15.
      }
      function catalog_attr_changed(){
//        if (pref.catalog.filter.attr_list)
//          for (var th in threads) catalog_attr_set(th,threads[th][0]);
//        if (pref.catalog.filter.attr_list) {
          pref_func.apply_prep(attr_list,true);
          for (var name in threads) catalog_attr_set(name,threads[name][0]);
//          show_catalog(); // don't require.
//        }
      }

      var pop_up_delay_id = {};
      function pop_up_delay(e,name){
        if (!pref.catalog_popup) return; 
        if (threads[name][0].style.width=='' && threads[name][0].style.height=='' && pref.catalog_no_popup_at_expanded) return;
        if (pref.catalog_popdown=='imm' || pop_up_status[name]) pop_up_op(e,name); // patch
        else {
          if (pop_up_delay_id[name]) clearTimeout(pop_up_delay_id[name]);
          else { // init
            threads[name][0].addEventListener('mousemove' , threads[name][2][1]);
            threads[name][6] = function(){clearTimeout(pop_up_delay_id[name]);};
            threads[name][0].addEventListener('mouseout'  , threads[name][6]);
          }
          pop_up_delay_id[name] = setTimeout(function(){pop_up_op(e,name);},pref.catalog_popup_delay);
        } 
      }
      function pop_up_op(e,name){
        if (pop_up_status[name]) {
          pop_keep_event(name);
          return;
        }
        var ch = threads[name][0];
        if (pop_up_delay_id[name]) {
          ch.removeEventListener('mousemove' , threads[name][2][1]);
          ch.removeEventListener('mouseout'  , threads[name][6]);
          delete pop_up_delay_id[name];
        }
//        var pn = cnst.init('pop:background:'+threads[name][10]+':border:1px solid blue');
        var pn = cnst.init('pop:border:1px solid blue');
        if (document.documentElement.clientWidth/2-e.clientX>0) pn.style.left = e.clientX + 10 + 'px';
        else pn.style.right = document.documentElement.clientWidth - e.clientX + 10 + 'px';
        if (document.documentElement.clientHeight/2-e.clientY>0) pn.style.top = e.clientY + 10 + 'px';
        else  pn.style.bottom = document.documentElement.clientHeight - e.clientY + 10 + 'px';
        pn.innerHTML = threads[name][3][0];
//        var date_mark = Date.parse(pref.catalog.filter.time_mark_str) - pref.localtime_offset*3600000;
//        trim_html(pn, threads[name][3][1], pref.catalog_format.hover, get_mark_time(name,pref.catalog.filter.time_mark,pref.catalog.filter.list_mark_time,pref.catalog.filter.watch_list_mark_time));
        trim_html(pn, threads[name][3][1], pref.catalog_format.hover, name);
        var nickname = name.replace(/\/.*/,'');
//        if (pref.catalog.filter.list_mark_time && threads[name][9][1]) site2[nickname].mark_newer_posts(pn,threads[name][9][1]);
        var date = get_mark_time(name,pref.catalog.filter.time_mark,pref.catalog.filter.list_mark_time,pref.catalog.filter.watch_list_mark_time);
        if (date>0) site2[nickname].mark_newer_posts(pn,date);
        threads[name][12] = add_open_new_thread_event(name,site2[nickname].modify_thread_link(pn));
        pn.style.background = '#e5ecf9';
        catalog_attr_set(name,pn);
        pn = site.root_body.appendChild(pn);
        if (pref.catalog_popup_size_fix) { 
          pn.style.width  = pn.offsetWidth + 'px';
          pn.style.height = pn.offsetHeight + 'px';
        }
        pop_up_status[name] = [null, function(){pop_down_event(name);}, function(){pop_keep_event(name);}, ch, pn];
        if (pref.catalog_popdown=='imm') {
          if (document.documentElement.clientHeight/2-e.clientY>0) {
            if (parseInt(pn.style.top.replace(/px/,''),10) + pn.offsetHeight > document.documentElement.clientHeight) {
              if (pn.offsetHeight > document.documentElement.clientHeight) pn.style.top = '0px';
              else {pn.style.top = ''; pn.style.bottom = '0px';}
            }
          } else if (parseInt(pn.style.bottom.replace(/px/,''),10) + pn.offsetHeight > document.documentElement.clientHeight) {pn.style.bottom = ''; pn.style.top = '0px';}
        } else {
          pn.addEventListener('mouseover', pop_up_status[name][2], false);
          pn.addEventListener('mouseout', pop_up_status[name][1], false);
        }
        ch.addEventListener('mouseout', pop_up_status[name][1], false);
      }
      function pop_keep_event(name){
        if (pop_up_status[name][0]) {clearTimeout(pop_up_status[name][0]);pop_up_status[name][0]=null;}
      }
      function pop_down_event(name){
        if (!pop_up_status[name][0]) pop_up_status[name][0] = setTimeout(function(){pop_down_op(name);},(pref.catalog_popdown=='imm')? 0 : pref.catalog_popdown_delay);
      }
      function pop_down_op(name){
//        if (pop_up_status[name]==undefined) return;
        ch = pop_up_status[name][3];
        pn = pop_up_status[name][4];
        ch.removeEventListener('mouseout' , pop_up_status[name][1], false);
        if (pref.catalog_popdown!='imm') {
          pn.removeEventListener('mouseover', pop_up_status[name][2], false);
          pn.removeEventListener('mouseout' , pop_up_status[name][1], false);
        }
        if (threads[name][12]) threads[name][12] = remove_open_new_thread_event(threads[name][12]);
        pn = cnst.div_destroy(pn,true);
        delete pop_up_status[name]; //prevent memory leak.
      }

//      var page_delim = [];
//      for (var i=0;i<site.max_page;i++) page_delim[i] = null;
//      var page_delim_idx = [];

      var load_list = {refresh: {key:'',    idx:0, tgts:null, mutex:true, use_cache:false, from_auto:false, page_check:true },
                       ondemand:{key:'odl', idx:0, tgts:null, mutex:true, use_cache:false, from_auto:false, page_check:false},
                       tag:     {key:'tag', idx:0, tgts:null, mutex:true, use_cache:true,  from_auto:false, page_check:false}};
      var filter_tags_refresh_mem = {};
      var refresh_use_cache = false;
      function make_refresh_list(){
//      function make_refresh_list(remove_attr){
        var tgts = [];
        if (pref.catalog.filter.bookmark_list) tgts = pref.catalog.filter.bookmark_list_str.replace(/\/\/.*$/mg,',').replace(/\n/g,',').replace(/,,+/g,',').replace(/^,/,'').replace(/,$/,'').split(',');
        if (tgts[0]==='') tgts = [];
        if (pref.catalog.on_bt_page && board_sel.selectedIndex==0) pref_func.str2obj('catalog_board_list_str');
        var blist = pref.catalog_board_list_obj[board_sel.selectedIndex];
//        var page_str = (pref.catalog.design==='page')? 'p' : 'c';
        for (var j=0;j<pref.catalog_max_page;j++)
          for (var i=1;i<blist.length;i++) {
//            if (blist[i]['key'].search(/[^\/]*\/[^\/]*\/[0-9]+/)!=-1) {if (j==0) tgts.push(blist[i]['key']);} // working code.
            if (common_func.fullname2dbt(blist[i].key)[2]) {if (j==0) tgts.push(blist[i].key);}
            else if (!blist[i]['num'] || j<blist[i]['num']) tgts.push(blist[i].key+'p'+j);
          }
//        if (remove_attr) for (var i=0;i<tgts.length;i++) tgts[i] = tgts[i].replace(/!.*/,'');
        return tgts;
      }
      function trim_list(tgts,embed_init){
        if (pref.catalog.board.ex_list) {
          for (var i=tgts.length-1;i>=0;i--) {
            var val = pref_func.merge_obj5(tgts[i],pref.catalog.board.ex_list_obj2,{hit:false});
            if (val.hit) tgts.splice(i,1);
          }
        }
        if (pref.catalog.design==='catalog' || (pref.catalog.design==='auto' && embed_catalog)) {
          for (var i=tgts.length-1;i>=0;i--) {
            var dbt = cnst.name2domainboardthread(tgts[i],true);
//            if (tgts[i].search(/\/p[0-9]*/)!=-1) {
            if ((dbt[0]!=='KC') && tgts[i].search(/\/p[0-9]*/)!=-1) {
//            if ((dbt[0]==='8chan' ||dbt[0]==='4chan') && tgts[i].search(/\/p[0-9]*/)!=-1) {
//            if (dbt[0]==='8chan' && tgts[i].search(/\/p[0-9]*/)!=-1) {
//              if (tgts[i].search(/\/p0$/)!=-1 && (!embed_init || dbt[1]!=site.board)) tgts[i] = tgts[i].replace(/p0/,(pref.catalog.catalog_json)? 'j0' : 'c0');
              if (tgts[i].search(/\/p0$/)!=-1 && (!embed_init || dbt[1]!=site.board || dbt[0]!=site.nickname || dbt[0]==='4chan'))
                tgts[i] = tgts[i].replace(/p0/,(pref.catalog.catalog_json || dbt[0]==='4chan')? 'j0' : 'c0');
              else tgts.splice(i,1);
            }
          }
        }
        if (embed_page && embed_init) { // patch
          if (pref.page.scan_tag) {
            var bds = {};
            for (var i=0;i<tgts.length;i++) {
              var dbt = cnst.name2domainboardthread(tgts[i],true);
              bds[dbt[0]+dbt[1]+((pref.catalog.catalog_json)? 'j0':'c0')] = null;
            }
            cataLog.scan_init('init_tag',bds, {tag_only:true});
          }
          var flag = false;
          for (var i=0;i<tgts.length;i++) {
            if (flag) threads_idx[threads_idx.length] = 'ODL:'+tgts.splice(i--,1)[0];
            else if (tgts[i].indexOf(site.nickname+site.board+'p0')!=-1) {
              tgts.splice(i--,1)[0];
              flag = pref.catalog_load_on_demand;
            }
          }
          if (flag) drawn_idx = 0;
        }
        return tgts;
      }


      function remove_threads_events(name){
        threads[name][0].removeEventListener('mouseover', threads[name][2][0], false);
        common_func.dom_removeEventListener(threads[name][5]);
        if (threads[name][11]) threads[name][11] = remove_open_new_thread_event(threads[name][11]);
      }
      function remove_thread(name){
        if (name.substr(0,4)!=='ODL:' && threads[name]) { // BUG. SHOULD WORK WITHOUT CHECKING threads[name]
          var dbt = common_func.fullname2dbt(name);
          if (threads[name][16].popups) for (var i in threads[name][16].popups) site2[dbt[0]].popups_release(threads[name][16].popups[i],i, name);
          remove_threads_events(name);
          if (threads[name][1]) {
            if (pop_up_status[name]) pop_down_op(name);
            if (threads[name][0].parentNode===triage_parent) {
              if (pref.catalog_expand_with_hr && !embed_catalog) show_catalog_hr(name,'remove');
              triage_parent.removeChild(threads[name][0]); // for 4chan's native
            }
          }
        }
        delete threads[name]; // remove 'ODL:' also
if (pref.debug_mode['2']) console.log('removed: '+name);
        for (var i=threads_idx.length-1;i>=0;i--) if (threads_idx[i]===name) {threads_idx.splice(i,1);break;}
      }
////      function remove_thread(name){ // working code.
////        if (name.substr(0,4)!=='ODL:' && threads[name]) { // BUG. SHOULD WORK WITHOUT CHECKING threads[name]
////          var dbt = common_func.fullname2dbt(name);
////          if (threads[name][16].popups) for (var i=0;i<threads[name][16].popups.length;i++) site2[dbt[0]].popups_release(threads[name][16].popups[i]);
//////        if (name.substr(0,4)!=='ODL:') {
//////          if (threads[name][16].th_destroy) threads[name][16].th_destroy(threads[name][0], threads[name][16].parse_funcs);
////          threads[name][0].removeEventListener('mouseover', threads[name][2][0], false);
//////          threads[name][0].removeEventListener('click', threads[name][5], false);
//////          for (var i=0;i<threads[name][5].length;i++) threads[name][5][i].removeEventListener('click', click_thread, false);
////          common_func.dom_removeEventListener(threads[name][5]);
////          if (threads[name][11]) remove_open_new_thread_event(threads[name][11]);
////          if (threads[name][1]) {
//////            if (threads[name][12]) remove_open_new_thread_event(threads[name][12]);
////            if (pop_up_status[name]) pop_down_op(name);
//////            triage_parent.removeChild(threads[name][0]);
////            if (threads[name][0].parentNode===triage_parent) triage_parent.removeChild(threads[name][0]); // for 4chan's native
////          }
//////          if (threads[name][17][0][0].length!=0) liveTag.remove_tags_in_th(threads[name][17][0][0], name);
//////          if (threads[name][17][1][0].length!=0) liveTag.remove_tags_in_th(threads[name][17][1][0], name);
//////          liveTag.remove_tags_in_th(name);
////        }
////        delete threads[name]; // remove 'ODL:' also
////if (pref.debug_mode['2']) console.log('removed: '+name);
////        for (var i=threads_idx.length-1;i>=0;i--) if (threads_idx[i]===name) {threads_idx.splice(i,1);break;}
////      }
      var threads_candidates_of_deletion = null;
      function catalog_clear_threads(num, schedule){
//        threads_last_deleted = {};
//        catalog_triage_out();
        var idx = 0;
        while (idx<threads_idx.length && idx<num) if (threads_idx[idx++].substr(0,4)==='ODL:') num++;
        if (!schedule) {
          catalog_triage_out();
          while (threads_idx.length>num) {
            var name = threads_idx[threads_idx.length-1];
//          if (name.substr(0,4)!=='ODL:') threads_last_deleted[name] = {sticky:threads[name][20], last_post_time:threads[name][8][4], last_post_count:threads[name][8][2]};
//          threads_last_deleted[name] = threads[name][20];
            remove_thread(name);
          }
        } else {
          if (threads_candidates_of_deletion===null) threads_candidates_of_deletion = {};
          while (threads_idx.length>num) {
            var name = threads_idx[num++];
            if (name.substr(0,4)==='ODL:') {remove(name);num--;}
            else threads_candidates_of_deletion[name] = (threads[name][8][4]||threads[name][8][0]);
          }
        }
        if (!schedule) remake_boards();
      }
      function remake_boards(){
        boards = {};
        for (var name in threads) {
          var dbt = cnst.name2domainboardthread(name,true);
          boards[dbt[0]+dbt[1]] = null;
        }
      }
      function catalog_refresh(refresh, embed_init, from_auto, indicator) {
//if (pref.debug_mode['0']) console.log(new Date().toLocaleTimeString() + ', refresh: start: ');
//        set_auto_update();
        if (pref.catalog.filter.time_ago_str_sync_at_refresh) ago_clicked();
        load_list.refresh.use_cache = !refresh;
        load_list.refresh.idx = 0;
        load_list.refresh.mutex = true;
        load_list.refresh.from_auto = from_auto;
        load_list.refresh.tgts = trim_list(make_refresh_list(),embed_init);
        if (threads_candidates_of_deletion!==null) {
          catalog_triage_out(); // for safety
          for (var name in threads_candidates_of_deletion) if (threads[name] && threads_candidates_of_deletion[name]===(threads[name][8][4]||threads[name][8][0])) remove_thread(name);
          threads_candidates_of_deletion = null;
          remake_boards();
        }
        if (refresh && pref.catalog_refresh_clear && !embed_init) catalog_clear_threads(pref.catalog.max_threads_at_refresh, true);
//        for (var i=0;i<load_list.refresh.tgts.length;i++) load_list.refresh.tgts[i] = [load_list.refresh.tgts[i], from_auto];
        load_on_demand.release(); // prevent from hanging up.
        if (load_list.refresh.idx<load_list.refresh.tgts.length) {
//if (!pref.test_mode['15']) scan_boards.scan_init('refresh', load_list.refresh.tgts, {refresh:true, crawler_max:1, indicator:indicator, callback:catalog_refresh_watch});
if (!pref.test_mode['15']) scan_boards.scan_init('refresh', load_list.refresh.tgts, {refresh:true, indicator:indicator, callback:catalog_refresh_watch, from_auto:from_auto, load_on_demand:pref.catalog_load_on_demand});
else {
//          health_indicator.shift('limegreen','0');
          load_list.refresh.indicator = indicator;
          get_page(load_list.refresh);
}
        } else catalog_refresh_watch();
//        scan_boards.scan_init('refresh_tag',filter_tags_refresh_mem,(refresh)? 0 : pref.scan.lifetime*60, catalog_refresh_watch);
if (pref.test_mode['22'])
        scan_boards.scan_init('refresh_tag', filter_tags_refresh_mem, {lifetime:((refresh)? 0 : pref.scan.lifetime*60), cache_write:true});
      }
      function catalog_refresh_watch() {
//console.log('test');
        var tgts = {};
        for (var name in threads) if (threads[name][21]) tgts[name] = null;
        scan_boards.scan_init('refresh_watch', tgts, {callback:catalog_refresh_gather_info, refresh:true});
//console.time('refresh_watch');
//        scan_boards.scan_init('refresh_watch', tgts, {callback:catalog_refresh_gather_info, force_json:pref.catalog.order.find_sage_in_8chan});
      }
      cataLog.catalog_refresh_watch = catalog_refresh_watch;
      function catalog_refresh_gather_info() {
//console.timeEnd('refresh_watch');
        var tgts = {};
        for (var name in threads) {
          if (!pref.catalog.filter.time && !pref.catalog.filter.list && !threads[name][9][0]) continue;
//          var dbt = common_func.name2domainboardthread(name);
//          if (dbt[0]==='8chan' && pref.catalog.indexing==4 && threads[name][23]) tgts[name] = true; // get time of sage post in 8chan from json.
//          if (pref.catalog.indexing==4 && threads[name][23] && threads[name][23].time_posted===null) tgts[name] = true; // get time_posted
          if (pref.catalog.indexing==4 && threads[name][8][4]===undefined) tgts[name] = true; // get time_posted
//          if (!threads[name][9][0]) continue;
//          if (dbt[0]==='8chan' && pref.catalog.order.sticky!=='dont_care' && threads[name][20]===null) tgts[dbt[0]+dbt[1]] = true; // get sticky in 8chan from json.
        }
//console.log(tgts);
        scan_boards.scan_init('refresh_watch', tgts, {force_json: true,
                                                      callback: (pref.liveTag.utilize_boards_json && embed_catalog)? catalog_refresh_boards : catalog_liveTag_scan_boards,
                                                      callback_args: 'refresh_watch'});
        if (pref.liveTag.utilize_boards_json && embed_catalog) catalog_liveTag_scan_threads(); // patch for 8chan, boards_json is too heavy.
      }

      function catalog_refresh_boards() { // patch for 8chan
        if (liveTag.mems['8chan']) {
          var tgts = liveTag.list_nup.get_list_board(true);
          var flag = false;
          for (var i=0;i<tgts.length;i++) if (tgts[i].key.split('/')[0]==='8chan') {flag=true; break;}
          if (flag) http_req.get('refresh_watch','8chan,boards_json,boards_json,boards_json',site2['8chan'].url_boards_json(),catalog_refresh_boards_callback,0,true,catalog_liveTag_scan_boards);
          else catalog_liveTag_scan_boards();
        } catalog_liveTag_scan_boards();
      }
      function catalog_refresh_boards_callback(key,value,callback){
//if (pref.debug_mode['7']) console.log('boards_json:');
        if (value.status==200) {
          var dbt = key.split(',');
          site2[dbt[0]].postprocess_board(value.response);
////          site3[dbt[0]].boards = value.response.boards || value.response; // patch for 8chan. WHY DO THEY CHANGE THE SPEC REPEATEDLY WITHOUT A PARTICULAR REASON??? // working code.
////          site3[dbt[0]].boards_to_scan = null;
////          if (site2[dbt[0]].make_site3_bds) site2[dbt[0]].make_site3_bds();
        }
        if (callback) callback();
      }

      var mutex_wd_liveTag_scan_boards = new MutexWithWatchdog('scan_boards');
      function catalog_liveTag_scan_boards() {
        if (pref.liveTag.use) {
          if (!mutex_wd_liveTag_scan_boards.get()) {catalog_refresh_end();return;}
          if (pref.debug_mode['7']) var d_str = '';
          var tgts = liveTag.list_nup.get_list_board();
////          var tgts = []; // working code.
////          var time_th = Date.now()-pref.liveTag.pickup_interval*1000;
////          for (var i in liveTag.list_nup_boards) {
////            var dbt = common_func.fullname2dbt(i);
////            if (liveTag.list_nup_boards[i].time<time_th && (!liveTag.list_nup_boards[i].max || liveTag.list_nup_boards[i].max<liveTag.mems[dbt[0]][dbt[1]].max)) {
////              tgts[tgts.length] = i;
////              if (pref.debug_mode['7']) d_str += i + ':' +liveTag.list_nup_boards[i].max+'/'+liveTag.mems[dbt[0]][dbt[1]].max+', ';
////            }
////          }
          if (pref.debug_mode['7']) for (var i=0;i<tgts.length;i++) d_str += tgts[i].key + ':' +tgts[i].read_max+'/'+tgts[i].max+', ';
          if (Object.keys(tgts).length!=0) {
            scan_boards.scan_init('scan', tgts, {callback: catalog_liveTag_scan_boards_cont,
                                                 watchdog: mutex_wd_liveTag_scan_boards.restart.bind(mutex_wd_liveTag_scan_boards),
                                                 crawler_watchdog: true});
            if (pref.debug_mode['7']) console.log('catalog_liveTag_scan_boards: '+tgts.length+', '+d_str);
          } else {
            mutex_wd_liveTag_scan_boards.stop();
            catalog_liveTag_scan_threads();
          }
        } else catalog_liveTag_scan_threads();
      }
      function catalog_liveTag_scan_boards_cont() {
        mutex_wd_liveTag_scan_boards.stop();
        catalog_liveTag_scan_boards();
      }
      function catalog_liveTag_scan_cancel() {
        mutex_wd_liveTag_scan_boards.abort();
        scan_boards.scan_init('scan', {}, {});
        mutex_wd_liveTag_scan_threads.abort();
        scan_boards.scan_init('scan_threads', {}, {});
      }

//      var mutex_wd_update_liveTag = (function(){ // watchdog for 8chan's unstability. // working code.
//        var mutex = true;
//        var wdg = new DelayBuffer(function(){
//          mutex = true;
//          if (pref.debug_mode['5']) console.log('watchdog:');},30000);
//        return {
//          mutex: function(){return mutex;},
//          start: function(){
//            mutex = false;
//            wdg.delayed_do();
//          },
//          restart: function(){
//            wdg.cancel();
//            wdg.delayed_do();
//          },
//          stop: function(){
//            wdg.cancel();
//            mutex = true;
//          },
//        }
//      })();

      var mutex_wd_liveTag_scan_threads = new MutexWithWatchdog('scan_threads');
      function catalog_liveTag_scan_threads() {
        if (!mutex_wd_liveTag_scan_threads.get()) {catalog_refresh_end();return;} // multi entry.
////        var tgts = []; // working code.
////        for (var i in liveTag.list_nup)
////////          if (liveTag.list_nup[i]!==null) {
////////            liveTag.list_nup[i] = null;
////////            tgts[tgts.length] = i;
////////          } else delete liveTag.list_nup[i];
//////          if (--liveTag.list_nup[i]>=0) tgts[tgts.length] = i; // leave nodes of <0 as black listed, patch for 8chan.
////          if (liveTag.list_nup[i]>0) tgts[tgts.length] = i;
        var tgts = liveTag.list_nup.get_list_thread();
        if (Object.keys(tgts).length!=0) scan_boards.scan_init('scan_threads', tgts, {callback: catalog_liveTag_scan_threads_cont,
                                                                                      watchdog: mutex_wd_liveTag_scan_threads.restart.bind(mutex_wd_liveTag_scan_threads),
                                                                                      crawler_watchdog: true});
        else {
          mutex_wd_liveTag_scan_threads.stop();
          catalog_refresh_end();
        }
      }
      function catalog_liveTag_scan_threads_cont() {
        mutex_wd_liveTag_scan_threads.stop();
        catalog_liveTag_scan_threads();
      }
      cataLog.catalog_liveTag_scan_threads = catalog_liveTag_scan_threads;

//      var mutex_update_liveTag = true; // working code.
//      function catalog_update_liveTag() {
//        if (!mutex_update_liveTag) {catalog_refresh_end();return;} // multi entry.
//        var tgts = [];
////var debug_ary=[];
////        var time_now = Date.now();
////        var time_th = time_now-pref.liveTag.pickup_interval*1000;
//        for (var i in liveTag.list_nup)
//          if (liveTag.list_nup[i]!==null) {
////debug_ary[debug_ary.length] = i+','+liveTag.list_nup[i];
//            liveTag.list_nup[i] = null;
//            tgts[tgts.length] = i;
//          } else delete liveTag.list_nup[i];
//        if (Object.keys(tgts).length!=0) {
//          mutex_update_liveTag = false;
////if (pref.debug_mode['3']) console.log('update_liveTag: '+debug_ary+': '+tgts.length);
////          scan_boards.scan_init('update_liveTag', tgts, {callback:catalog_update_liveTag_cont});
//          scan_boards.scan_init('scan', tgts, {callback:catalog_update_liveTag_cont});
//        } else catalog_refresh_end();
//      }
//      function catalog_update_liveTag_cont() {
//        mutex_update_liveTag = true;
////console.log('update_liveTag_cont:');
//        catalog_update_liveTag();
//      }

      function catalog_refresh_end(){
        if (pref.notify.favicon || pref.notify.title.notify) notifier.favicon.set(threads);
//        if (pref.liveTag.style) liveTag.refresh_end_proc();
//if (pref.debug_mode['9']) for (var i in liveTag.list_nup) if (liveTag.list_nup[i]<=0) console.log('list_nup: '+i+', '+liveTag.list_nup[i]);
        common_func.set_value_to_root(liveTag.mems.watch,'9',null);
        common_func.set_value_to_root(liveTag.mems.watch,'4',null);
        if (pref.debug_mode['3']) {
          var th_count = 0;
          for (var d in liveTag.mems) for (var b in liveTag.mems[d]) for (var t in liveTag.mems[d][b]) th_count++;
          var ths = {};
          for (var i in liveTag.tags_ci) for (j of liveTag.tags_ci[i].mems.keys()) ths[j.key] = null;
          console.log('refresh_end: tags_ci+tags: '+Object.keys(liveTag.tags_ci).length+'+'+Object.keys(liveTag.tags).length+', threads:'+th_count+', '+Object.keys(ths).length);
        }
        if (pref.catalog_load_on_demand) show_catalog();
      }

//      function catalog_refresh_gather_info() {
//        if (pref.catalog.order.sticky!=='dont_care') {
//          var tgts = {};
//          for (var name in threads) if (threads[name][20]===null) {
//            var dbt = common_func.name2domainboardthread(name);
//            tgts[dbt[0]+dbt[1]] = null;
//          }
//          if (Object.keys(tgts).length!=0) scan_boards.scan_init('refresh_watch', tgts, {force_json:true, callback:re_sort_thread});
//        }
//      }
//      var flag_initial_refresh = pref.catalog.on_bt_page && pref.catalog.refresh.except_bt;
    setTimeout(function(){ // patch for liveTag.
      catalog_refresh(pref.catalog.refresh.initial && !pref.catalog.on_bt_page, embed_catalog || embed_page, false);
    },1);
      function catalog_insert(key) {
if (!pref.test_mode['15']) {
        var dbt = key.split(',');
        if (pref.catalog_promiscuous || (dbt[0]+dbt[1] in boards)) scan_boards.scan_init('snoop', [key], {lifetime:3600, crawler_max:1, tgt_raw:true});
} else {
        if (embed_catalog) return;
//        if (cached_info==null) return;
        var dbt = cnst.name2domainboardthread(key,true);
        if (dbt[0]+dbt[1] in boards) brwsr.sw_cache.trygetItem(key,catalog_insert_snoop);
}
      }
      function catalog_insert_snoop(key,value) {
        catalog_insert2(key,value,true,true);
      }
      function catalog_insert2(key,value,snoop,from_auto) {
//var check_perf = ['catalog_refresh :', performance.now()];
        var dbt = key.split(',');
        var nickname = dbt[0];
        var board = dbt[1];
        var read_type = dbt[3];
        var page_no = dbt[2];
        var thread = dbt[2];
////////        var dbt = cnst.name2domainboardthread(key,true);
////////        var nickname = dbt[0];
////////        var board = dbt[1];
////////        var read_type = (dbt[2][0]==='p')? 'page_html' : ((dbt[2][0]==='c')? 'catalog_html' : ((dbt[2][0]==='j')? 'catalog_json' : 'thread_html'));
////////        var page_no = (read_type==='thread_html')? '?' : dbt[2].substr(1);
////////        var thread = dbt[2];
        if (snoop && !pref.catalog_promiscuous && read_type==='thread_html' && !threads[name]) {
          var hit = false;
          for (var i=0;i<load_list.refresh.tgts.length;i++) if (load_list.refresh.tgts[i][0].indexOf(name)!=-1) {hit=true;break;}
          if (!hit) return 0; // return if no interest.
        }
if (pref.test_mode['3']) return;
        if (!('response' in value)) value.response = (read_type==='catalog_json')? JSON.parse(value.responseText)
                                                                                 : new DOMParser().parseFromString(value.responseText, 'text/html'); // cause memory leak at KC/int/.
if (pref.test_mode['2']) return;
//check_perf.push(performance.now());
        var tgts_show = {};
//        catalog_clear_threads(pref.catalog.max_threads);
////////        if ((read_type==='page_html' || read_type==='thread_html') && nickname==='NONE') { // for debug
//////////        if ((read_type==='page_html' || read_type==='thread_html') && nickname==='KC') { // for debug
//////////        if ((read_type==='page_html' || read_type==='thread_html') && nickname!=='8chan') { // for debug
//////////        if ((read_type==='page_html' && nickname!=='8chan') || read_type==='thread_html') { // for debug
//////////        if (read_type==='page_html' || read_type==='thread_html') {
////////          var name = nickname + board + thread;
////////          if (snoop && !pref.catalog_promiscuous && read_type==='thread_html' && !threads[name]) {
////////            var hit = false;
////////            for (var i=0;i<load_list.refresh.tgts.length;i++) if (load_list.refresh.tgts[i][0].indexOf(name)!=-1) {hit=true;break;}
////////            if (!hit) return 0; // return if no interest.
////////          }
//////////          value.responseText = site2[nickname].preprocess_html(value.responseText,read_type==='page_html'); // cause memory leak.
//////////          var doc = ('response' in value)? value.response : new DOMParser().parseFromString(value.responseText, 'text/html');
////////          var doc = value.response;
////////          site2[nickname].preprocess_doc(doc);
////////          var nof_posts = 0;
////////          var nof_files = 0;
////////          if (read_type==='thread_html') {
////////            var nof_pi = site2[nickname].thread2headline(doc);
////////            nof_posts  = nof_pi[0];
////////            nof_files = nof_pi[1];
////////            nof_pi = null; // for test
////////            site2[nickname].add_thread_link(doc,site2[nickname].make_url3(board,thread));
////////          }
////////          if (site.nickname!=nickname || site.board!=board) site2[nickname].absolute_link(doc,board);
////////          var threads_in_page = site2[nickname].catalog_threads_in_page(doc);
////////          var th_no = site2[nickname].get_ops(doc);
////////
////////          for (var i=0;i<threads_in_page.length;i++) {
////////            var p_node = threads_in_page[i].parentNode;
////////            insert_thread_from_page(threads_in_page[i], nickname, board, th_no[i], page_no+((read_type==='page_html' && pref.show_page_fraction)? '.'+i : ''), (i==0)?nof_posts : 0, (i==0)?nof_files : 0, snoop, value.date);
//////////          if (threads_in_page[i].parentNode==p_node) threads_in_page[i].parentNode.removeChild(threads_in_page[i]);
////////            tgts_show[nickname+board+th_no[i]]=true;
////////          }
////////        } else {
//          if (read_type==='thread_html') site2[nickname].add_thread_link(value.response,site2[nickname].make_url3(board,thread));
//          if (read_type==='page_html' || read_type==='thread_html') site2[nickname].preprocess_doc(value.response);
          var ths;
if (pref.test_mode['0']) {
          ths = {domain:nickname, board:board, page:page_no};
          if (read_type==='catalog_json') ths.obj = value.response;
          else ths.pn = value.response;
          site2[ths.domain].parse_funcs[read_type].entry(ths,site2[ths.domain].parse_funcs[read_type]['before_test']);
          ths = ths.ths;
} else {
//////          ths = Object.create({domain:nickname, board:board, page:page_no, parse_funcs:site2[nickname].parse_funcs[read_type], __proto__:site4.parse_funcs_on_demand});
//////          if (read_type==='catalog_json') ths.obj = value.response;
//////          else Object.defineProperty(ths,'pn',{value:value.response, enumerable:true, configurable:true, writable:true});
////          var parse_obj = Object.create({domain:nickname, board:board, page:page_no, parse_funcs:site2[nickname].parse_funcs[read_type], __proto__:site4.parse_funcs_on_demand});
////          ths = (read_type==='catalog_json')? {obj:value.response, __proto__:parse_obj} : {pn:value.response, __proto__:parse_obj};
////          ths = ths.ths;
          ths = site2[nickname].wrap_to_parse.get(value.response, nickname, board, read_type, {page:page_no});
}
          if (read_type==='catalog_json' || read_type==='catalog_html') rm_items_404_check(nickname,board,ths); // consumes 15-40 ms, too slow.
          if (snoop && !pref.catalog_promiscuous) for (var i=ths.length-1;i>=0;i--) if (!(ths[i].key in threads)) ths.splice(i,1);
//check_perf.push(performance.now());
          for (var i=0;i<ths.length;i++) {
//            if (read_type!=='catalog_json' && ths[i].pn.parentNode) ths[i].pn.parentNode.removeChild(ths[i].pn); // patch for memory leak issue, but probably fixed.
            if (insert_thread_with_test(ths[i], read_type, value.date)) tgts_show[ths[i].key]=true;
          }
////////        }
//check_perf.push(performance.now());
        if (Object.keys(tgts_show).length!=0) {
          show_catalog(tgts_show,from_auto);
//          if (pref.catalog.filter.tag_scan_auto) scan_tags();
        }
//check_perf.push(performance.now());
//check_perf.push('num: '+Object.keys(tgts_show).length);
//common_func.perf_out(check_perf);
      }

      function rm_items_404_check(domain, board, ths){
//        if (pref.catalog.filter.bookmark_list_rm404) {
//          var val = catalog_obj_merge(db,pref.catalog.filter.list_obj3,null);
//          val = catalog_obj_merge(db,pref.catalog.filter.attr_list_obj3,val);
//          if (val.hit) return true;
//        }
//        return false;
//        return pref.catalog.filter.bookmark_list_rm404
//            && ((db in pref.catalog.filter.list_obj3) || (db in pref.catalog.filter.attr_list_obj3) || (db in pref.catalog.filter.watch_list_obj3));
        var db = domain + board;
        var flag_item = (pref.catalog.filter.bookmark_list_rm404
            && ((db in pref.catalog.filter.list_obj3) || (db in pref.catalog.filter.attr_list_obj3) || (db in pref.catalog.filter.watch_list_obj3)));
        if (flag_item || pref.liveTag.use) {
          var nos = {};
          for (var i=0;i<ths.length;i++) nos[ths[i].key] = true;
          if (flag_item) rm_items_404(db,nos);
          if (pref.liveTag.use) {
            var rm_list = liveTag.rm_404(domain, board, nos);
            if (pref.liveTag.rm_404_immediately) for (var i=0;i<rm_list.length;i++) if (threads[rm_list[i]]) remove_thread(rm_list[i]);
          }
        }
      }
      function rm_items_404(db,nos){
//console.log('rrr');
        var tgts = [[pref.catalog.filter.list_str,      pref.catalog.filter.list_obj2,      search_ex_list],
                    [pref.catalog.filter.attr_list_str, pref.catalog.filter.attr_list_obj2, attr_list],
                    [pref.catalog.filter.watch_list_str, pref.catalog.filter.watch_list_obj2, watch_list]];
        for (var i=0;i<tgts.length;i++) {
          var changed = false;
//          for (var name in tgts[i][1]) { // too slow
//            var dbt = common_func.name2domainboardthread(name,true);
////            if (dbt[0]===nickname && dbt[1]===board && dbt[2]!=='') {
////              var flag = false;
////              for (var j=0;j<ths.length;j++) if (dbt[2]==ths[j].no) {flag=true;break;}
////              if (!flag) {
//            if (dbt[0]+dbt[1]===db && dbt[2]!=='') {
//              if (nos[dbt[2]]===undefined) {
//                if (pref.debug_mode['0']) console.log(name);
//                triage_exe(name,'DELETE','',false);
//                changed = true;
//                if (threads[name]) remove_thread(name);
//              }
//            }
//          }
          for (var name in tgts[i][1]) {
//            if (!(name in nos) && name.indexOf(db)==0) {
            if (name.indexOf(db)==0 && name.length!=db.length && !(name in nos)) {
              if (pref.debug_mode['0']) console.log(name);
              triage_exe(name,'DELETE','',false);
              changed = true;
              if (threads[name]) remove_thread(name);
            }
          }
          if (changed) {
            tgts[0][2].value = tgts[0][2].value.replace(/\n\n+/g,'\n'); // triage_exe executes both.
            tgts[1][2].value = tgts[1][2].value.replace(/\n\n+/g,'\n');
            tgts[2][2].value = tgts[2][2].value.replace(/\n\n+/g,'\n');
            pref_func.apply_prep(tgts[i][2],true);
            pref_func.apply_prep(tgts[i][2],false);
          }
        }
      }

      function req_events(key,value,list) {
        list.mutex = true;
//if (pref.debug_mode['0']) console.log(new Date().toLocaleTimeString() + ', refresh: callback: '+load_list.refresh.tgts[load_list.refresh.idx]+', '+load_list.refresh.idx);
        if (value.status==200 && (value.responseText || value.response)) catalog_insert2(key,value,false,list.from_auto);
        else {
          if (value.status==404) comment_out_bookmark(key);
          health_indicator.set(list.indicator,'orange');
        }
        if (list.idx<list.tgts.length && value.status<500) {
          if (!pref.catalog_load_on_demand) get_page(list);
        } else {
          if (list.idx==1 && value.status!=200) health_indicator.set(list.indicator,'red','X');
          else if (list.idx==list.tgts.length) health_indicator.set(list.indicator,null,'\u25cf');
          else health_indicator.set(list.indicator,null,'\u25b2');
          if (list.check_page) {
            refresh_idx_page = 0;
            page_check_entry();
          } else http_req.close('catalog'+list.key);
          catalog_refresh_watch();
        }
      }
      function get_page(list){
//if (pref.debug_mode['0']) console.log(new Date().toLocaleTimeString() + ', refresh: get: '+list.tgts[list.idx]+', '+list.idx);
        if (pref.catalog_load_on_demand && list.idx==0) 
          for (var i=list.tgts.length-1;i>=1;i--) {
            var name = 'ODL:'+list.tgts[i];
            if (threads[name]) remove_thread(name);
            threads_idx.unshift(name);
          }
//        if (tgt===undefined) tgt = list.tgts[list.idx];
//        else tgt = [tgt,false];
        if (list.idx==0 && !list.indicator) list.indicator = health_indicator.shift('limegreen','0');
        health_indicator.set(list.indicator,null,(list.idx+1)+'/'+list.tgts.length);
        http_req.get('catalog'+list.key,list.tgts[list.idx].replace(/!.*/,''),'',req_events,list.use_cache,true,list);
        list.idx++;
        list.mutex = false;
      }

//      function req_events(key,value,args) {
////if (pref.debug_mode['0']) console.log(new Date().toLocaleTimeString() + ', refresh: callback: '+refresh_tgts[refresh_idx][0]+', '+refresh_idx);
//        var inserted_idx = 0;
////        var key = refresh_tgts[refresh_idx][0].replace(/!.*/,'');
////        var key = args[0].replace(/!.*/,'');
//        if (value.status==200 && value.responseText) {
//          inserted_idx = catalog_insert2(key,value,false,args[1]);
//        } else {
//          if (value.status==404) comment_out_bookmark(key);
//          health_indicator.set('orange');
//        }
//        refresh_idx++;
//        if (refresh_idx<refresh_tgts.length && value.status<500) {
//          if (!pref.catalog_load_on_demand) get_page();
//          else {
//            if (threads_idx.length==inserted_idx+1) threads_idx.push('url');
//            else threads_idx.splice(inserted_idx+1,0,'url');
////            threads_idx.splice(page_delim_idx[refresh_idx],0,'url'); // THIS MAKES SUBTLE BUG, insert point slides from here at snoop refresh, but ok to use, so I'll omit.
//            show_catalog();
//          }
//        } else {
//          if (refresh_idx==1 && value.status!=200) health_indicator.set('red','X');
//          else if (refresh_idx==refresh_tgts.length) health_indicator.set(null,'\u25cf');
//          else health_indicator.set(null,'\u25b2');
//          refresh_idx_page = 0;
//          page_check_entry();
//        }
//      }
//      function get_page(){
////if (pref.debug_mode['0']) console.log(new Date().toLocaleTimeString() + ', refresh: get: '+refresh_tgts[refresh_idx][0]+', '+refresh_idx);
//        health_indicator.set(null,(refresh_idx+1)+'/'+refresh_tgts.length);
//        http_req.get('catalog',refresh_tgts[refresh_idx][0].replace(/!.*/,''),'',req_events,refresh_use_cache,true,refresh_tgts[refresh_idx]);
//      }

      var refresh_idx_page;
      function page_check_entry(){
        while (refresh_idx_page<load_list.refresh.tgts.length) {
          if (load_list.refresh.tgts[refresh_idx_page][0].search(/!page/)==-1) refresh_idx_page++;
          else {
            var name = load_list.refresh.tgts[refresh_idx_page++][0].replace(/!.*/,'');
            if (threads[name]) {
              if (threads[name][14].toString()[0]=='?') {
                var page_no_old = parseInt(threads[name][15].toString().replace(/\..*/,''),10);
                if (isNaN(page_no_old)) page_no_old = 0;
                page_check(name,page_no_old,page_check_callback);
                break;
              }
            }
          }
        }
      }
      function page_check_callback(name,str,date){
//console.log('Callback : '+name+', '+str);
        update_page_in_footer(name,str,date); // to show Dead.
        page_check_entry();
      }
      function update_page_in_footer(name,str,date){
//        if (threads[name]) {
        if (threads[name] && threads[name][0].getElementsByTagName('div')['catalog_footer']) { // patch for threads, this will be removed.
          var pn = threads[name][0].getElementsByTagName('div')['catalog_footer'].childNodes[0];
          if (pn) {
//            var str = str + '@' + new Date(date).toLocaleTimeString();
            pn.innerHTML = pn.innerHTML.replace(/[^\/]*$/,str);
          }
          threads[name][13]=date;
          threads[name][15]=threads[name][14];
          threads[name][14]=str;
        }
      }
 
      function page_check(name,page_ini,callback){
        var dbt = cnst.name2domainboardthread(name,true);
        var domain = dbt[0];
        var board = dbt[1];
        var thread = dbt[2];
        var page_idx = [];
        var max_page = site2[domain].max_page(dbt[1]);
        page_idx[0] = page_ini;
        page_idx[1] = (page_ini+1)%(max_page+1);
        for (var i=0;i<=max_page;i++) if (i!=page_idx[0] && i!=page_idx[1] && (!refresh_use_cache || i!=max_page)) page_idx.push(i);
//        if (!refresh_use_cache) for (var i=0;i<5;i++) page_idx.push(page_idx[i]); // for retry, but live cache working...
        var page_no;
        var key;
      
        function page_check(){
          page_no = page_idx.shift();
          key = (page_no==max_page)? domain+board+thread : domain+board+'p'+page_no;
//          http_req.get('catalog',key,url,req_events_page_check,refresh_use_cache);
          http_req.get('catalog',key,'',req_events_page_check,refresh_use_cache,true);
        }
        page_check();
        function req_events_page_check(key,value) {
//console.log('Read : '+name+', '+key+', '+value.status);
          var callback_str = null;
          if (value.status!=200) {
            if (page_no==max_page && value.status==404) callback_str = 'Dead';
            else callback_str = 'HTTP'+value.status;
          } else {
            var doc = ('response' in value)? value.response : new DOMParser().parseFromString(value.responseText, 'text/html');
            var ops = site2[domain].get_ops(doc);
            var hit = false;
            if (page_no!=max_page) for (var i=0;i<ops.length;i++) if (thread==ops[i]) {hit=true;callback_str = page_no+((pref.show_page_fraction)? '.'+i : '');}
            if (!hit) {
              if (value.responseText != null && page_idx.length!=0) setTimeout(page_check, 0); // live cache make racing condition with this. I don't know why.
              else callback_str = '?' + ((!refresh_use_cache)? '(missing)' : '');
              if (site2[domain].check_thread_archived(doc)) callback_str = 'Archived';
            }
          }
          if (value.status==200) catalog_insert2(key,value,true); // update
          if (callback_str!==null) {
            if (callback_str==='Dead' || callback_str==='Archived') {
              comment_out_bookmark(name);
//              var tgt = pn12_0_4.getElementsByTagName('textarea')['catalog.filter.bookmark_list_str'];
//              tgt.value = comment_out_key(name,tgt.value);
//              pref_func.apply_prep(tgt,true);
            }
            callback(name,callback_str,value.date);
          }
//console.log('Out : '+name+', '+key+', '+value.status);
        }
      }
      function comment_out_bookmark(name){
        var tgt = pn12_0_4.getElementsByTagName('textarea')['catalog.filter.bookmark_list_str'];
        tgt.value = comment_out_key(name,tgt.value);
        pref_func.apply_prep(tgt,true);
      }
      function comment_out_key(key,str){
////        var comments = [];
////        var str_ret = '';
////        var comment = new RegExp('//.*$','m');
////        while (1) {
////          var idx = str.search(comment);
////          if (idx!=-1) comments.push([idx,str.match(comment)[0]]);
////          else break;
////        }
//        return str.replace(key,'//$&');
        var rep_str = (pref.catalog.filter.bookmark_list_rm404)? '' : '//$&';
////        return str.replace(new RegExp(key+'(!page)*(,|\n|$)','g'),rep_str); // working code.
        var dbt = key.split(',');
        return str.replace(new RegExp(dbt[0]+dbt[1]+dbt[2]+'(!page)*(,|\n|$)','g'),rep_str);
      }

      initialize_loop = false;
      pref_func.mirror_targets.pn12_0_2 = pn12_0_2;
      pref_func.mirror_targets.pn12_0_4 = pn12_0_4;

      return {
        destroy: function(){ // destructor
          catalog_triage_out();
          for (var name in threads) remove_thread(name);
          pref_func.remove_onchange(pn12_0_2); // prevent leak.
          pref_func.remove_onchange(pn12_0_4); // prevent leak.
          pref_func.mirror_targets.pn12_0_2 = null;
          pref_func.mirror_targets.pn12_0_4 = null;
          catalog_clear_threads(0);
          if (brwsr.sw_cache && brwsr.sw_cache.subscribe) brwsr.sw_cache.subscribe(false);
          pref_func.health_indicator = null;
//          if (embed_catalog) if (catalog_native_destroy) catalog_native_destroy();
          pref_func.board_sel = null;
          window_beforeunload();
          pref_func.tooltips.remove_hier(pn12_triage);
          pref_func.tooltips.remove_hier(pn12_0_4);
          pref_func.tooltips.hide();
//          clearTimeout(auto_update_timer);
          auto_update.stop_if_running();
          pn12.parentNode.removeChild(pn12);
          window.removeEventListener('storage', site2[site.nickname].prep_own_posts_event, false); // debug
          scroll_event_src.removeEventListener('scroll', show_catalog_cont, false);
          pn12.removeEventListener('dragstart', auto_hide_catalog, false);
          pn12.removeEventListener('dragend'  , auto_hide_catalog, false);
//          pn12_triage.removeEventListener('mouseover', catalog_triage_out_clear, false);
//          pn12_triage.removeEventListener('mouseout' , catalog_triage_out_delay, false);
          pn12 = null;
          liveTag.pn = null;
          for (var i in cataLog) cataLog[i] = null;
          return null;
        },
        remake_triage: remake_triage,
        triage_exe_pipe: triage_exe_pipe,
        catalog_insert: catalog_insert,
        update_all_footers: update_all_footers,
        pn12_0_4: pn12_0_4,
        pn12_0_2: pn12_0_2,
        catalog_resized: catalog_resized,
        get_threads: function(){return threads;},
        catalog_filter_changed: catalog_filter_changed,
        scan_boards: scan_boards,
        get_watch_time_of_a_thread: get_watch_time_of_a_thread,
        show_catalog: show_catalog,
//        threads: threads,
        catalog_liveTag_scan_cancel: catalog_liveTag_scan_cancel,
        catalog_liveTag_scan_site: onchange_funcs['scanSite'],
      }
    }
    return {
      catalog_func: function(){return catalog_func;},
      scan_tags_common: scan_tags_common,
      show_hide: show_hide,
    }
  }

  function make_chart_obj(pn1){
//  var chart_obj = (function(){
//    var pn1 = div_init(1,'5px',  '30px','button','Graph');
//    var pn1 = cnst.init('left:0px:tile:get:bottom:button:Graph:Show:tile:set:left:tile:set:bottom');
    var pref_graph = {key: null, pipe: null};
    pn1.addEventListener('click', show_hide, false);
    var data = chart_data_init();
    pref_graph.key = pref.script_prefix + '.graph.' + site.board;
    if (localStorage && pref.load_data && localStorage.getItem(pref_graph.key)!==null) data = brwsr.JSON_parse(localStorage.getItem(pref_graph.key));

    var pn2_func = null;
    function show_hide(){  // Toggle Show/Hide
      if (pn2_func==null) pn2_func = prep_pn2();
      else pn2_func = pn2_func.destroy();
    }
//    var size_loc = ['400px', '400px', '5px', '50px', '120px', '390px'];

    function prep_pn2(){
      var data_graph;
      var chart_posts;
//      var pn2 = div_init(2,size_loc[2],size_loc[3],'div','',size_loc[0],size_loc[1]);
//      var pn2 = cnst.init('left:5px:bottom:50px:resize:both:Show:tb:width:400px:height:400px:resize:both:overflow:hidden',
      var pn2 = cnst.init('left:0px:tile:get:bottom:resize:both:Show:tb:width:400px:height:400px:resize:both:overflow:hidden',
        function(){pn2.appendChild(pn6);},function(){pn2.removeChild(pn6);},show_hide,chart_redraw)[0];
      var pn2_2 = document.createElement('div');
      var pn2_2 = cnst.add_to_tb(pn2,'<input type="checkbox" name="graph_animation">animation');
      pref_func.apply_prep(pn2_2,false);
      var animation = pn2_2.childNodes[0];
      animation.onchange = function(){pref_func.apply_prep(pn2_2,true);};
//      pn2.id = 'pn2_debug';
//      var pn6 = div_init(6,size_loc[4],size_loc[5],'div','');
      var ch = document.createElement('canvas');
//      ch.style.border = '1px solid black';
      var pn2_1 = pn2.childNodes[1];
      pn2_1.appendChild(ch);
//      pn2.appendChild(ch);
      var pn6 = cnst.init('left:120px:bottom:' + (parseInt(pn2.style.bottom.replace(/px/,''),10)+300) +'px:border:1px solid lightblue');
      pn2.appendChild(pn6);
      chart_create_draw();
      function chart_create_draw(){
//        ch.style.background = '#e5ecf9';
//        ch.style.width  = pn2.style.width;
//        ch.style.height = pn2.style.height;
//        ch.width  = pn2.style.width.replace(/px/,'');
//        ch.height = pn2.style.height.replace(/px/,'');
        ch.style.width  = pn2_1.style.width;
        ch.style.height = (pn2_1.style.height.replace(/px/,'')-10)+'px';
        ch.width  = pn2_1.clientWidth;
        ch.height = pn2_1.clientHeight - 10;
        var ctx = ch.getContext('2d');
        data_graph = chart_data_init(); // deep copy always.
        data_graph.labels = data.labels.slice(-pref.max_graph);
        data_graph.datasets[0].data = data.datasets[0].data.slice(-pref.max_graph);
        data_graph.datasets[1].data = data.datasets[1].data.slice(-pref.max_graph);
        var threads = data_graph.datasets[1].data;
        var scale_thread = pref.scale_thread;
        if (scale_thread!=1) for (var i=0;i<threads.length;i++) threads[i] *= scale_thread;
        Chart.defaults.global.animation = animation.checked;
        chart_posts = new Chart(ctx).Line(data_graph, {bezierCurve: false});
        var str = '<ul class="line-legend"><li style="color:rgba(151,187,205,1)"><span style="color: black;">Posts</span></li><li style="color:rgba(204,0,0,1)"><span style="color: black;">Threads ' + ((pref.scale_thread==1)? '' : 'x'+ pref.scale_thread) + '</span></li></ul>'
        pn6.innerHTML = str;
      };
//      pn2.addEventListener('resize',  //) // can't get.
      pn2_1.addEventListener('click', chart_redraw, false);
      pn2.addEventListener('dragover', dragover_pn2, false);
      pn2.addEventListener('drop', drop_pn2, false);
      pn2.addEventListener('dragend', div_dragend_pn2, false);
      pn6.addEventListener('dragend', function(e){e.stopPropagation();}, false);
      cnst.bottom_top(pn2);
      cnst.bottom_top(pn6);
      function chart_redraw(){
        chart_posts.destroy();
        chart_create_draw();
//        chart_posts.resize();
      }
      function dragover_pn2(e) {e.preventDefault();}
      function drop_pn2(e) {
        e.preventDefault(); // FF require this.
        var str = e.dataTransfer.getData('text');
        if (str!='') {
          if (pref.import_format=='obj') data = JSON.parse(str);
          else {
            var str_s = str.split(/\r\n|\r|\n|\\n/);
            data.labels = str_s[0].split(',');
            for (var i=0;i<2;i++) {
              var str_sc = str_s[i+1].split(',');
              for (var j=0;j<str_sc.length;j++) data.datasets[i].data[j] = (str_sc[j]!='')? parseInt(str_sc[j],10) : 0;
            }
          }
        }
        chart_redraw();
      }
      function div_dragend_pn2(e){
        pn6.style.left   = (parseInt(pn6.style.left.replace(/px/,''))   + e.screenX - cnst.drag_sx()) + 'px';
//        pn6.style.bottom = (parseInt(pn6.style.bottom.replace(/px/,'')) - e.screenY + cnst.drag_sy()) + 'px'; // from bottom.
        pn6.style.top    = (parseInt(pn6.style.top.replace(/px/,'')) + e.screenY - cnst.drag_sy()) + 'px';
      }
      return {
        destroy : function (){
          if (!brwsr.ff) chart_posts.stop();
          chart_posts.destroy();
          pn2.removeEventListener('click', chart_redraw, false);
          pn2.removeEventListener('dragover', dragover_pn2, false);
          pn2.removeEventListener('drop', drop_pn2, false);
          pn2.removeEventListener('dragend', div_dragend_pn2, false);
          pn6.removeEventListener('dragend', function(e){e.stopPropagation();}, false);
          size_loc = [pn2.style.width, pn2.style.height, pn2.style.left, pn2.style.bottom, pn6.style.left, pn6.style.bottom];
//          ch = null;
          cnst.div_destroy(pn6, false);
          cnst.div_destroy(pn2, true);
//          data_graph = null;
//          chart_posts = null;
          return null;
        },
        clear : function () {chart_redraw();},
        data_update : function(time_str, posts, threads){
          while (data_graph.labels.length>=pref.max_graph) chart_posts.removeData();
          chart_posts.addData([posts,threads*pref.scale_thread],time_str);
          chart_posts.update();
        }
      }
    }

    return {
      clear: function(){
        data = chart_data_init();
        if (pn2_func!=null) pn2_func.clear();
      },
      dump: function(format){ // http://stackoverflow.com/questions/22055598/writing-a-json-object-to-a-text-file-in-javascript
        var url;
        if (format=='csv') {
          var out_labels = data.labels;
          var out_data0 = data.datasets[0].data;
          var out_data1 = data.datasets[1].data;
          url = 'data:text/json;charset=utf8,' + encodeURIComponent(out_labels) + '\\n' + encodeURIComponent(out_data0) + '\\n' + encodeURIComponent(out_data1);
        } else if (format=='obj') url = 'data:text/json;charset=utf8,' + JSON.stringify(data);
        window.open(url, '_blank');
        window.focus();
      },
      data_update: function(time_str, posts, threads){
        if (pn2_func!=null) pn2_func.data_update(time_str, posts, threads);
        if (data.labels.length>=pref.max_capture) {
          data.datasets[0].data.slice(-pref.max_capture+1);
          data.datasets[1].data.slice(-pref.max_capture+1);
          data.labels.slice(-pref.max_capture+1); // labels are copied shallowly, but now made deep copy manually.
        }
        data.labels.push(time_str);
        data.datasets[0].data.push(posts);
        data.datasets[1].data.push(threads);
        if (pref.aggregator=='true' && pref.write_to_ls && localStorage) {
          localStorage.setItem(pipe_name,  JSON.stringify([time_str, posts, threads]));
          localStorage.setItem(pref_graph.key, JSON.stringify(data));
        }
      }
    }
    function chart_data_init() {
      var data = {
          labels: ['dummy','dummy'], // at least 2 data required at first, or filling collapse. This is probably a BUG in Chart.js.
          datasets: [
              {
                  label: 'Posts',
                  fillColor: 'rgba(151,187,205,0.2)',
                  strokeColor: 'rgba(151,187,205,1)',
                  pointColor: 'rgba(151,187,205,1)',
                  pointStrokeColor: '#fff',
                  pointHighlightFill: '#fff',
                  pointHighlightStroke: 'rgba(151,187,205,1)',
                  data: [0,0]
              },
              {
                  label: 'Threads',
                  fillColor: 'rgba(204,0,0,0.2)',
                  strokeColor: 'rgba(204,0,0,1)',
                  pointColor: 'rgba(204,0,0,1)',
                  pointStrokeColor: '#fff',
                  pointHighlightFill: '#fff',
                  pointHighlightStroke: 'rgba(204,0,0,1)',
                  data: [0,0]
              }
          ]
      };
      return data;
    }
//  })();
  }

  function make_setting_obj(pn8){
//  var setting = (function(){
//    var pn8 = div_init(8,'55px','30px','button','settings');
//    var pn8 = cnst.init('left:55px:bottom:30px:button:settings:Show');
    pn8.addEventListener('click', show_hide, false);
    var pn7 = null;
    var pn7_1 = null;
    function show_hide(){  // Toggle Show/Hide
      pn7 = prep_pn7(pn7==null);
    }
    function prep_pn7(make){
      if (make) {
//        pn7 = div_init(7,'5px','50px','div','');
//        pn7 = cnst.init('left:5px:bottom:50px:Show:tb',cnst.void_func,cnst.void_func,show_hide,cnst.void_func);
//if (pref.test_mode['17']) pn7 = cnst.init('left:0px:tile:get:bottom:Show',cnst.void_func,cnst.void_func,show_hide,cnst.void_func); // leaks nodes.
if (pref.test_mode['17']) {pn7 = document.createElement('div');pn7.innerHTML='<div></div><div></div>';site.root_body.appendChild(pn7);} // leaks nodes.
else 
        pn7 = cnst.init('left:0px:tile:get:bottom:Show:tb',cnst.void_func,cnst.void_func,show_hide,cnst.void_func)[0];
if (pref.test_mode['17']) pn7_1 = pn7;
else 
        pn7_1 = pn7.childNodes[1];
        pn7_1.innerHTML = '<div><div style="float:left">\
Statistics:<br>\
&emsp;Interval: <input type="text" name="interval_found" size="6" style="text-align: right;">min<br>\
&emsp;<input type="checkbox" name="check_page"> Show page no. of this thread<br>\
&emsp;&emsp;<input type="checkbox" name="show_page_fraction"> Show fraction of page No.<br>\
&emsp;<input type="checkbox" name="check_post"> Show num of new posts in this board<br>\
&emsp;<input type="checkbox" name="check_thread"> Show num of new threads in this board<br>\
&emsp;&emsp; Max_capture: <input type="text" name="max_capture" size="6" style="text-align: right;"> points<br>\
&emsp;&emsp;&emsp;Show recent : <input type="text" name="max_graph" size="6" style="text-align: right;"> points in graph<br>\
&emsp;&emsp;&emsp;Scale of #threads in graph: <input type="text" name="scale_thread" size="6" style="text-align: right;"><br>\
<!-- &emsp;&emsp;<input type="radio" name="autoconf" value="auto"> Automatic configuration<br>\
&emsp;&emsp;<input type="radio" name="autoconf" value="manual"> Manual configuration<br> -->\
&emsp;&emsp;&emsp;<input type="radio" name="aggregator" value="true"> Aggregate data<br>\
&emsp;&emsp;&emsp;&emsp;<input type="checkbox" name="write_to_ls"> Write to localStrage (server)<br>\
&emsp;&emsp;&emsp;<input type="radio" name="aggregator" value="false"> Listen from localStrage (client)<br>\
&emsp;&emsp;<input type="checkbox" name="load_data"> Load data from localStrage at the start<br>\
&emsp;&emsp;Import format (drop whole text on graph)<br>\
&emsp;&emsp;&emsp;<input type="radio" name="import_format" value="csv"> csv<br>\
&emsp;&emsp;&emsp;<input type="radio" name="import_format" value="obj"> obj<br>\
&emsp;&emsp;<input type="button" value="Dump(csv)"><input type="button" value="Dump(obj)">&emsp;<input type="button" value="Clear data"><br>\
<input type="checkbox" name="auto_start"> Start automatically (Delayed 10sec.)<br>\
<br>'+
//          'UIP tracker for 4chan:<br>'+
//          '&emsp;<input type="checkbox" name="uip_tracker.on"> Show num of unique IPs after post No.<br>'+
//          '&emsp;&emsp;<input type="checkbox" name="uip_tracker.posts"> Show num of posts(checking for deletion timing)<br>'+
//          '&emsp;&emsp;Interval: <input type="text" name="uip_tracker.interval" size="3" style="text-align: right;">sec'+
//          '&emsp;<input type="checkbox" name="uip_tracker.adaptive"> Adaptive<br>'+
//          '&emsp;<input type="checkbox" name="uip_tracker.auto_open"> Open next thread automatically<br>'+
//          '&emsp;&emsp;Conditions:<br>'+
//          '&emsp;&emsp;&emsp;After <input type="text" name="uip_tracker.auto_open_th" size="3" style="text-align: right;">th post<br>'+
//          '&emsp;&emsp;&emsp;OP contains <textarea style="height:1em" cols="20" name="uip_tracker.auto_open_kwd"></textarea><br>'+
//          '<br>'+
'For dollchan: (workaround for bugs)<br>\
&emsp;<input type="checkbox" name="workaround_for_dollchan"> Consistency checker for thubmnails of attached images<br>\
&emsp;&emsp;runs at<br>\
&emsp;&emsp;<input type="radio" name="wafd_tb" value="tb">every time when mouse leaves from thumbnail\'s area<br>\
&emsp;&emsp;<input type="radio" name="wafd_tb" value="reply">only when mouse hovers on the reply button<br>\
&emsp;<input type="checkbox" name="wafd_open_spoiler"> Open text spoilers<br>\
&emsp;&emsp;(You must turn off the same function in dollchan beforehand)<br>\
<!-- Post form:<br>\
&emsp;<input type="checkbox" name="hide_rules"> Hide rules<br>\
&emsp;<input type="checkbox" name="hide_Go"> Hide \'Go\'<br> -->\
<br>\
<br>'+
//Share loaded html with other tabs to update<br>\
//&emsp;<input type="checkbox" name="info_server"> Broadcast loaded html to other tabs (server)<br>\
//&emsp;<input type="checkbox" name="info_client"> Listen other tab\'s broadcasting (client)<br>\
//<br>\
//Command interface for overwriting site preference<br>\
//&emsp;<textarea style="height:1em" cols="40" name="overwrite_site2_json_str"></textarea><br>\
//&emsp;<input type="button" value="JSON"><br>\
//&emsp;<textarea style="height:1em" cols="40" name="overwrite_site2_eval_str"></textarea><br>\
//&emsp;<input type="button" value="EVAL"><br>\
//</div><div style="float:left">&emsp;&emsp;&emsp;</div><div style="float:left">'+
//Catalog:<br>\
//&emsp;Cross domain connection:<br>\
//&emsp;&emsp;<input type="radio" name="catalog_cross_domain_connection" value="direct"> Direct connection<br>\
//&emsp;&emsp;<input type="radio" name="catalog_cross_domain_connection" value="indirect"> Indirect connection<br>\
//<!-- &emsp;&emsp;<input type="checkbox" name="catalog_fake_access"> Fake access made by human to avoid poor administration<br>\
//&emsp;&emsp;&emsp;(This causes heavier network traffic and server load,<br>\
//&emsp;&emsp;&emsp;but administrators can\'t see what script you are using)<br>\
//&emsp;Configuration:<br>\
//&emsp;&emsp;(To get faster feeling, you should check them all.)<br> -->\
//&emsp;Networking: load on demand for reducing initial network traffic<br>\
//&emsp;&emsp;<input type="checkbox" name="catalog_draw_on_demand"> Threads<br>\
//&emsp;&emsp;<input type="checkbox" name="catalog_load_on_demand"> HTMLs<br>\
//&emsp;Localtime offset<input type="text" name="localtime_offset" size="2" style="text-align: right;"><br>'+
//          '&emsp;Tagging:<br>'+
//          '&emsp;&emsp;Ignore tags latter than <input type="text" name="catalog.tag.ignore" size="2" style="text-align: right;">th in a board/thread<br>'+
//          '&emsp;&emsp;Ignore boards/threads which have more than <input type="text" name="catalog.tag.max" size="2" style="text-align: right;"> tags<br>'+
//          '&emsp;Board group configuration:<br>'+
//          '&emsp;&emsp;<textarea rows="9" cols="60" name="catalog_board_list_str"></textarea><br>'+
//          '&emsp;&emsp;<input type="checkbox" name="catalog.board.owners_recommendation"> Read owner\'s recommendation<br>'+
////          '&emsp;&emsp;<input type="button" value="Scan"> Scan board tags<br>'+
//          '&emsp;&emsp;<input type="button" value="Generate"> Generate board groups from tags<br>'+
//          '&emsp;<input type="checkbox" name="catalog.style_general_list"> Use general style<br>'+
//          '&emsp;&emsp;<textarea rows="4" cols="40" name="catalog.style_general_list_str"></textarea><br>'+
//'&emsp;Catalog/Pop-up/Search<br>\
//<!-- &emsp;&emsp;<input type="checkbox" name="catalog_format.show.images_2nd">\
//<input type="checkbox" name="catalog_format.hover.images_2nd">\
//<input type="checkbox" name="catalog_format.search.images_2nd"> 2nd or more images in OP<br> -->\
//&emsp;&emsp;<input type="checkbox" name="catalog_format.show.posts">\
//<input type="checkbox" name="catalog_format.hover.posts">\
//<input type="checkbox" name="catalog_format.search.posts"> Posts<br>\
//&emsp;&emsp;<input type="checkbox" name="catalog_format.show.fileinfo">\
//<input type="checkbox" name="catalog_format.hover.fileinfo">\
//<input type="checkbox" name="catalog_format.search.fileinfo"> File information<br>\
//<!--&emsp;&emsp;<input type="checkbox" name="catalog_checkbox_deletion_show">\
//<input type="checkbox" name="catalog_checkbox_deletion_hover">\
//<input type="checkbox" name="catalog_checkbox_deletion_search"> Checkbox for deletion<br> -->\
//&emsp;&emsp;<input type="checkbox" name="catalog_format.show.contents">\
//<input type="checkbox" name="catalog_format.hover.contents">\
//<input type="checkbox" name="catalog_format.search.contents"> Format contents<br>\
//&emsp;&emsp;<input type="checkbox" name="catalog_format.show.layout">\
//<input type="checkbox" name="catalog_format.hover.layout">\
//<input type="checkbox" name="catalog_format.search.layout"> Format layout<br>\
//&emsp;&emsp;<input type="checkbox" name="catalog_format.show.style">\
//<input type="checkbox" name="catalog_format.hover.style">\
//<input type="checkbox" name="catalog_format.search.style"> Format style<br>\
//<!-- &emsp;&emsp;<input type="checkbox" name="catalog_border_show">&emsp;&emsp;&emsp; Show border<br> -->\
//<!-- &emsp;&emsp;<input type="checkbox" name="catalog_enable_background">&emsp;&emsp;&emsp; Use backgfound color<br> -->\
//&emsp;&emsp;<input type="checkbox" name="catalog_footer"> Info(num of posts, images and page)<br>\
//&emsp;&emsp;&emsp;<input type="checkbox" name="catalog_footer_br"> always over/under the image<br>\
//&emsp;&emsp;<input type="checkbox" name="catalog_popup"> Use pop-up window<br>\
//&emsp;&emsp;&emsp;appear/disappear:<br>\
//&emsp;&emsp;&emsp;<input type="radio" name="catalog_popdown" value="imm">immediately<br>\
//&emsp;&emsp;&emsp;<input type="radio" name="catalog_popdown" value="delay">delayed \
//<input type="text" name="catalog_popup_delay" size="6" style="text-align: right;">\
//<input type="text" name="catalog_popdown_delay" size="6" style="text-align: right;"> ms<br>\
//&emsp;&emsp;&emsp;<input type="checkbox" name="catalog_popup_size_fix"> Fix size when you move it<br>\
//&emsp;&emsp;&emsp;<input type="checkbox" name="catalog_localtime"> Localtime<br>\
//&emsp;&emsp;Num of posts in thread headline: <input type="text" name="catalog_t2h_num_of_posts" size="3" style="text-align: right;"><br>\
//&emsp;&emsp;<input type="checkbox" name="catalog_triage"> Enable triage pop-up<br>\
//&emsp;&emsp;&emsp; Style:<textarea style="height:1em" cols="40" name="catalog_triage_str"></textarea><br>\
//<!-- &emsp;<input type="checkbox" name="catalog_enable_cross_board"> Enable cross-board catalog<br> -->\
//<!-- &emsp;<input type="checkbox" name="catalog_enable_cross_domain"> Enable cross-domain catalog<br> -->\
//<!-- &emsp;&emsp; Cache working in <textarea style="height:1em" cols="20" name="catalog_sw_domain"></textarea><br> -->'+
//&emsp;Click to:<br>\
//&emsp;&emsp;<input type="radio" name="catalog_click" value="open">Go to/Open the thread<br>\
//&emsp;&emsp;<input type="radio" name="catalog_click" value="expand">Expand/shrink the OP in catalog<br>\
//&emsp;&emsp;&emsp;&emsp;<input type="checkbox" name="catalog_expand_at_initial"> Expand at initial<br>\
//&emsp;&emsp;&emsp;<input type="checkbox" name="catalog_no_popup_at_expanded"> Don\'t popup when the catalog is expanded<br>\
//&emsp;&emsp;<input type="checkbox" name="catalog_open_in_new_tab"> Open the thread in new tab<br>\
//&emsp;&emsp;&emsp;<input type="checkbox" name="catalog_use_named_window"> Prevent opening a thread in multiple tabs<br>\
//<br>\
'</div></div><div style="clear: both">\
<input type="button" value="cancel">\
<input type="button" value="apply">\
<input type="button" value="ok">\
&emsp;<input type="button" value="apply+save">\
<input type="button" value="load_default">\
<input type="button" value="load_samples">'+
//&emsp;&emsp;<input type="checkbox" name="debug_mode"> Debug mode\
//<input type="checkbox" name="show_tooltip"> Show tooltips\
'</div>';
if (!pref.test_mode['17']) { // node leak test.
        pref_apply_prep(false);
//        if (brwsr.ff) pn7.draggable = false;
        cnst.bottom_top(pn7);
}
      }
if (!pref.test_mode['17']) {
      var fm = pn7_1.getElementsByTagName('input');
      for (var i=0;i<fm.length;i++) {
        if (fm[i].type=='button') {
          if (make) fm[i].addEventListener('click', button_action, false);
          else fm[i].removeEventListener('click', button_action, false);
        }
      }
}
      if (make) return pn7;
      else {
if (pref.test_mode['17']) {
  pn7_1.innerHTML = '';
  pn7.parentNode.removeChild(pn7);
  return null;
} else
        pn7_1 = null;
        return cnst.div_destroy(pn7, true); // returns null
      }

//      function pref_apply_prep(set){
//        var fm = pn7_1.getElementsByTagName('input');
//        for (var i=0;i<fm.length;i++) {
//          if (fm[i].type=='button') continue;
//          var tgt = fm[i].name;
//          if (set) {
//            if      (typeof(pref[tgt])=='number' ) pref[tgt] = parseInt(fm[i].value,10);
//            else if (typeof(pref[tgt])=='boolean') pref[tgt] = fm[i].checked;
//            else if (typeof(pref[tgt])=='string' ) if (fm[i].checked) pref[tgt] = fm[i].value;
//          } else {
//            if      (typeof(pref[tgt])=='number' ) fm[i].value = pref[tgt];
//            else if (typeof(pref[tgt])=='boolean') fm[i].checked = pref[tgt];
//            else if (typeof(pref[tgt])=='string' ) if (pref[tgt] == fm[i].value) fm[i].checked = true;
//          }
//        }
//        if (set) {
//          sessionStorage.pref = JSON.stringify(pref);
//          listener();
//          timer_obj.init();
//        }
//      }
      function pref_apply_prep(set){
        pref_func.apply_prep(pn7_1,set);
        if (set) {
          listener();
          timer_obj.init();
          if (wafd!=null) wafd.workaround_for_dollchan_pref_changed();
        }
      }
      function button_action(e){
//        console.log(e);
        var src = e.currentTarget.value;
        if      (src=='apply'       ) pref_apply_prep(true);
        else if (src=='cancel'      ) show_hide();
        else if (src=='ok'          ) {pref_apply_prep(true);show_hide();}
        else if (src=='apply+save'  ) {pref_apply_prep(true);if (localStorage) localStorage[pref.script_prefix+'.pref']=JSON.stringify(pref);}
        else if (src=='load_default') {pref = pref_default();pref_apply_prep(false);pref_apply_prep(true);pref_func.obj_init();} // last pref_apply_prep is for writing to sessionStrage.
//        else if (src=='load_backwash_style') {pref_func.pref_overwrite(pref,pref_func.pref_samples['backwash']);pref_apply_prep(false);}
        else if (src=='load_samples') {pref_func.pref_samples.init();}
        else if (src=='Dump(csv)'   ) chart_obj.dump('csv');
        else if (src=='Dump(obj)'   ) chart_obj.dump('obj');
        else if (src=='Clear data'  ) chart_obj.clear();
        else if (src=='JSON'        ) {pref_func.apply_prep(pn7_1.getElementsByTagName('TEXTAREA')['overwrite_site2_json_str'],true);pref_func.site2_json();}
        else if (src=='EVAL'        ) {pref_func.apply_prep(pn7_1.getElementsByTagName('TEXTAREA')['overwrite_site2_eval_str'],true);pref_func.site2_eval();}
      }
    }
//  })();
  }

//  var listener = (function(){
  function make_listener(){
    var on = false;
    var value_old;
    function listen_event(e){
//      console.log('EVENT:'+e.key);
      if (e.newValue===null) return;
      if (e.key===pipe_name && pref.aggregator==='false') {
        var tmp = brwsr.JSON_parse(e.newValue);
        if (tmp[0]!=value_old) {
          value_old = tmp[0];
          chart_obj.data_update(tmp[0], tmp[1], tmp[2]);
          timer_obj.show_page([null, '+'+tmp[1]+'+'+tmp[2]+'@'+tmp[0]]);
        }
//      } else if (e.key.search(info_raw)!=-1 && pref.info_client) {
//        var page_no = e.key.substr(info_raw.length);
//        var timer = timer_obj.timer();
//        if (timer!=null) {
//          var value = JSON.parse(e.newValue);
//          timer.page_check4(value[0], page_no, new DOMParser().parseFromString(value[1],'text/html'));
//        }
      }
    }
    function setup(){
      if (!on && pref.aggregator==='false') {
        window.addEventListener   ('storage', listen_event, false);
        on = true;
      } else if (on && pref.aggregator==='true') {
        window.removeEventListener('storage', listen_event, false);
        on = false;
      }
    }
    setup();
    return setup;
  };
//  })();
  var listener = null;
  if (site.features.listener && pref.features.listener) listener = make_listener();

  function make_timer_obj(pn0){
//  var timer_obj = (function(){
////    var pn0 = div_init(0,'5px',  '5px' ,'txt','init');
//    var pn0 = cnst.init('left:0px:bottom:0px:txt:init:fontSize:24px:Show:tile:set:left:tile:set:bottom');
    pn0.addEventListener('click', function(){init(false);}, false);  // Toggle ON/OFF
    var timer_obj2 = null;
    function init(property_changed){
      if (timer_obj2 == null && (pref.check_page || (pref.aggregator=='true' && (pref.check_thread || pref.check_post)))) timer_obj2 = make_timer(pn0);
      else if (timer_obj2 != null) {
        if (!property_changed || (!pref.check_page && (pref.aggregator=='false' || (!pref.check_thread && !pref.check_post)))) stop_destroy();
        else if (property_changed) timer_obj2.timer().restart(false);
      }
    }
    function stop_destroy(){
      timer_obj2 = timer_obj2.destroy();
      pn0.style.color = 'gray';
    }
//    if (pref.auto_start) init(false);
    if (pref.auto_start) setTimeout(function(){init(false);},10000);
    var pn0_str = ['',''];
    return {
      init : function(){init(true);},
      finished : function(){stop_destroy();},
      timer: function(){return timer_obj2;},
      show_page : function(str){
//        pn0.appendChild(document.createTextNode(str+'@'+cnst.get_time()));
//        pn0.textContent = str+'@'+cnst.get_time();
        if (                 str[0]!=null) pn0_str[0] = str[0]+'@'+cnst.get_time();
        if (str.length>=2 && str[1]!=null) pn0_str[1] = str[1];
        if (str.length>=3 && str[2]!=null) pn0_str[0] = str[2];
//        pn0.textContent = pn0_str1 +', '+ pn0_str2 +', '+pn0_str3;
        if (pn0_str[0]!='' && pn0_str[1]!='') pn0.textContent = pn0_str[0] +', '+ pn0_str[1];
        else pn0.textContent = pn0_str[0] + pn0_str[1];
      }
    }
//  })();
  }

  function make_timer(pn0){
    var page = (function(){
      var idx = [];
      var p = 0;
      var now = 0;
      var str_place='';
      var check_page = pref.check_page;
      if (window.location.href.search(site.thread_keyword)==-1) check_page = false;
//      var flag = [false,false,mode_graph_only]; // top, last, myself, to be got.
      
//      idx[0] = 0;
//      idx[1] = site.max_page -1; // last page
//      for (var i=2;i<site.max_page;i++) idx[i]=i-1;
//      idx[site.max_page] = site.max_page; // +1 for myself.
      function init(){
        var j=0;
        idx[0] = -1; // -1 for mot match.
        idx[1] = -1;
        if (pref.check_post) idx[j++] = 0;
        if (pref.check_thread) idx[j++] = site.max_page-1;
        var next = (now+1)%(site.max_page+1);
        if (now !=idx[0] && now !=idx[1]) idx[j++] = now;  // idx[2] for page_no.
        if (next!=idx[0] && next!=idx[1]) idx[j++] = next; // idx[3] for next_page.
        for (var i=0;i<=site.max_page;i++)
          if (i!=now && i!=next && i!=idx[0] && i!=idx[1]) idx[j++] = i;
        flag = [!pref.check_post, !pref.check_thread, !check_page];
        p=0;
//        if (flag[0] && flag[1] && flag[2]) timer.stop();
      }
      init();
  
      return {
        no   : function() {return idx[p];},
        step : function() {p=(p+1)%(site.max_page+1);},
        prep_next : function() {init();},
        flag_set : function(i) {flag[i]=true;},
        all_got  : function() {return flag[0] && flag[1] && flag[2];},
        str_set  : function(i,j) {if (check_page && i!=site.max_page) {str_place = i + '.' + j; now=i;}}, // patch for a bug of showing '20.0'.
        str_get  : function() {return str_place;},
        init : function(){init();}
      }
    })();

    var last_post_old = 0;
    var last_post = 0;
    var last_ops_old = [];
    var num_of_new_threads = 0;
    var timer = (function(){
      var req = new XMLHttpRequest();
      req.addEventListener('load',  req_events, false);
      req.addEventListener('error', req_events, false);
      req.addEventListener('abort', req_events, false);
    
      function req_events(evt) {
        var parser = new DOMParser();
        if (req.status==404) timer.dead();
        else {
          var date = Date.now();
          if (pref.info_server && page.no()!=site.max_page && brwsr.sw_cache)
            brwsr.sw_cache.setItem(info_raw+'p'+page.no(),{date: date, status: req.status, responseText: req.responseText});
          if (pref.catalog_snoop_refresh && catalog_obj.catalog_func()!=null)
            catalog_obj.catalog_func().catalog_insert(info_raw+'p'+page.no(),{date: date, status: req.status, responseText: req.responseText});
          page_check2(parser.parseFromString(req.responseText, 'text/html'));
        }
      }
      function get_page(url) {
        req.open('GET', url, true);
        req.send(null);
      }
      var checking = false;
      var time_str;
      function page_check3(){
        if (!checking) {
          checking = true;
          time_str = cnst.get_time();
          page_check();
        }
      }
      function page_check(){
//        timer.stop(false);
//        var url = site.url_prefix + page.no() + '.html';
//        var url = site.make_url([site.board, page.no(), 'p')[0];
        var url = site2[site.nickname].make_url4([site.nickname, site.board, page.no(), 'page_html'])[0];
        if (page.no()==site.max_page) url = window.location.href;
        get_page(url);
      }

      var interval_missing = 1000;
//      var interval_found   = 60000 * 10;
//      var interval_error   = 60000 * 10; // 10 min.
      var retry_count = 0;
      var retry_limit = (site.max_page+1)+5;
      var id = null;
      var interval_old = 0;
      function timer_restart(force){
        if (force || interval_old != pref.interval_found) {
          timer_stop(false);
          id = setInterval(page_check3, pref.interval_found*60000);
        }
        interval_old = pref.interval_found;
      }
      timer_restart(true);
      page_check3();
      pn0.style.color = '#000000';

      function timer_stop(end){
        if (id!=null) clearInterval(id);
        id = null;
        if (end) pn0.style.color = 'gray';
      }

//      var myself = get_nos(document,-1,-1);
      var myself = (window.location.href.search(site.thread_keyword)!=-1)? get_nos(document,-1,-1) :-2;
      return {
//        req : function(){return req;}, // for debug
        req : req, // for debug
        found: function(){
          retry_count = 0;
//          id = setInterval(page_check3, pref.interval_found*60000);
          checking = false;
        },
        missing: function(){
          if (req.status==200 && retry_count++<retry_limit) setTimeout(page_check, interval_missing);
          else {
            retry_count = 0;
//            id = setInterval(page_check, interval_error);
            checking = false;
          }
        },
        stop:  function(end){timer_stop(end);},
        dead:  function(){timer_obj.show_page(['Dead']);timer_stop(true);timer_obj.finished();},
        myself: function(){return myself;},
        restart: function(force){timer_restart(force)},
        timestr: function(){return time_str;},
        destroy: function(){
          req.removeEventListener('load',  req_events, false);
          req.removeEventListener('error', req_events, false);
          req.removeEventListener('abort', req_events, false);
        }
      }
    })();

    if (brwsr.sw_cache && pref.info_client) brwsr.sw_cache.subscribe(true);
    return {
      destroy: function(){
        if (brwsr.sw_cache) brwsr.sw_cache.subscribe(false);
        timer.stop(true);
        timer.destroy();
        return null;
      },
      timer: function(){return timer;},
//      page_check4: page_check4
      page_check5: page_check5
    }

    function page_check5(key,value,args){
      var page_no = common_func.name2domainboardthread(key,true)[2].substr(1);
      page_check4(value.date, page_no, new DOMParser().parseFromString(value.responseText,'text/html'));
    }
    function page_check4(time_stamp, page_no, doc){
      var ops = site.get_ops(doc);
      var myself = timer.myself();
      for (var i=0;i<ops.length;i++) {
        if (myself==ops[i]) {
          page.str_set(page_no,i);
          var str = page.str_get() + '@' + new Date(time_stamp).toLocaleTimeString();
          timer_obj.show_page([null,null,str]);
          page.prep_next();
          timer.restart(true);
          if (pref.check_page) options.func0_exe(page.str_get());
          break;
        }
      }
    }

    function page_check2(doc){
      var page_no = page.no();
      get_nos(doc,timer.myself(),page_no);
      if (page.all_got() && page.no()!=site.max_page) {
        var increase_posts = (last_post_old==0)? 0 : last_post-last_post_old;
        var str = '';
        if (pref.check_page)   str = page.str_get();
        if (pref.check_post)   str = str + '+' + increase_posts;
        if (pref.check_thread) str = str + '+' + num_of_new_threads;
        timer_obj.show_page([str]);
        page.prep_next();
        timer.found();
        increase_posts = parseInt(increase_posts,10);
        if (isNaN(increase_posts) || increase_posts==null) increase_posts = 0;
        if (pref.check_post || pref.check_thread) chart_obj.data_update(timer.timestr(),increase_posts, num_of_new_threads);
        last_post_old = last_post;
        if (pref.check_page) options.func0_exe(page.str_get());
      } else {
        timer_obj.show_page([page_no+'?']);
        page.step();
        timer.missing();
      }
    }

    function get_nos(tgt_doc,myself,page_no){
//      var ops = [];
//      var num = 0;
//      var divs = tgt_doc.getElementsByTagName('div');
//      for (var i=0;i<divs.length;i++) {
//        if (divs[i].className == 'thread' || divs[i].className == 'thread kc_showReplies') {
//          var op_no = divs[i].id.substring(7); // substring(7) for removing 'thread_'
//          if (myself==op_no) {str_place = page.str_set(page_no,num); page.flag_set(2);}
//          ops[num++] = op_no;
//        }
//      }
      var ops = site.get_ops(tgt_doc);
      for (var i=0;i<ops.length;i++) if (myself==ops[i]) {page.str_set(page_no,i); page.flag_set(2);break;}
      if (myself==-1) return ops[0];
      if (page_no==0) {
        page.flag_set(0);
        last_post = get_last_post(tgt_doc);
      }
      if (page_no==site.max_page-1) {
        page.flag_set(1);
        var len = last_ops_old.length
        if (len!=0) {
          var last_op = ops[ops.length-1];
          var i=0;
          while (i<len && last_op!=last_ops_old[len-i-1]) i++;
          num_of_new_threads = i;
        } else num_of_new_threads = 0;
        last_ops_old = ops;
      }
    }

    function get_last_post(tgt_doc){
      var posts = site.get_posts(tgt_doc);
//      var posts = [];
//      var anchors = tgt_doc.getElementsByTagName('a');
//      var num = 0;
//      for (var i=0;i<anchors.length;i++)
//        if (anchors[i].name != '') posts[num++] = anchors[i].name;
      var last_post = posts[0];
      for (var i=1;i<posts.length;i++) {
        if (posts[i]>last_post) last_post=posts[i];
//      else break; // Cause a bug when a post had made in a sunk thread and immediately deleted.
      }
      return last_post;
    }
  }

//  function div_init(func, left, bottom, tp, str, width, height){
//    var pn = document.createElement('div');
//    pn.style.position = 'fixed';
//    pn.style.bottom = bottom;
//    pn.style.left = left;
//    pn.style.color = '#000000';
//    pn.style.fontWeight = 'normal';
//    pn.style.background = '#e5ecf9';
//    pn.style.padding = '0px 5px 2px 5px';
//    pn.style.border = '1px solid black';
//    if (tp=='txt' || (brwsr.ff && tp=='button')) {
//      pn.appendChild(document.createTextNode(str));
//      pn.style.cursor = 'pointer';
//    } else if (tp=='button') {
//      pn.innerHTML = '<input type="button" value="' + str + '">';
////      pn.innerHTML = '<button draggable="true">' + str + '</button>';
//      pn.style.padding = '0';
//      pn.style.border = '0';
//      pn.style.background = 'none';
//    }
//    if (func==0) {
//      pn.style.fontSize = '24px';
//    } else if (func==2) {
//      pn.style.padding = '0px 10px 0px 0px';
////      pn.style.margin = '10px';
//      pn.style.resize = 'both';
//      pn.style.overflow = 'hidden';
////      pn.style.width = '400px';
////      pn.style.height = '400px';
//      if (width) pn.style.width = width;
//      if (height) pn.style.height = height;
//    }
//    if (func!=10) site.root_body.appendChild(pn);
//    pn.draggable = true;
//    pn.addEventListener('dragstart', div_dragstart, false);
////    pn.addEventListener('dragstart', div_dragstart, true);
//    pn.addEventListener('dragend', div_dragend, false);
//    return pn;
//  }
//  function div_destroy(pn,child_of_body){
//    if (child_of_body) site.root_body.removeChild(pn);
//    pn.removeEventListener('dragstart', div_dragstart, false);
//    pn.removeEventListener('dragend', div_dragend, false);
//    return null;
//  }
//
//  var drag_sx;
//  var drag_sy;
////  var drag_cursor_style;
//  function div_dragstart(e){
//    drag_sx = e.screenX;
//    drag_sy = e.screenY;
////    drag_cursor_style = pn.style.cursor;
////    pn.style.cursor = 'move';
//    e.dataTransfer.setData('text/plain', ''); // for FF. CH doesn't require this.
////    e.preventDefault();
////    e.stopPropagation();
//  }
//  function div_dragend(e){
////    console.log('drag_end');
//    e.currentTarget.style.left   = (parseInt(e.currentTarget.style.left.replace(/px/,''))   + e.screenX - drag_sx) + 'px';
//    if (e.currentTarget.style.bottom!='') e.currentTarget.style.bottom = (parseInt(e.currentTarget.style.bottom.replace(/px/,'')) - e.screenY + drag_sy) + 'px'; // from bottom.
//    else e.currentTarget.style.top = (parseInt(e.currentTarget.style.top.replace(/px/,'')) + e.screenY - drag_sy) + 'px';
////    pn.style.cursor = drag_cursor_style;
//  }

  function make_wafd(){
    function on_change_workaround_for_dollchan(exe){
//      pref.workaround_for_dollchan = workaround_for_dollchan.checked;
      if (pref.workaround_for_dollchan == true) {
//        document.getElementById('postform_row_files').style.display = '';
//        var tmp = document.getElementsByTagName('input');
//        for (var i=0;i<tmp.length;i++) if (tmp[i].type=='file') tmp[i].parentNode.style.display = '';
        if (exe) on_change_workaround_for_dollchan_2(); // temporarily.
        if (pref.wafd_tb=='tb') document.getElementById('postform_label_comment').addEventListener('mouseout', on_change_workaround_for_dollchan, false);
        else site.postform_submit.addEventListener('mouseenter', on_change_workaround_for_dollchan, false);
      } else {
//        document.getElementById('postform_row_files').style.display = 'none';
        if (pref.wafd_tb=='tb') document.getElementById('postform_label_comment').removeEventListener('mouseout', on_change_workaround_for_dollchan, false);
        else site.postform_submit.removeEventListener('mouseenter', on_change_workaround_for_dollchan, false);
      }
    }
    function workaround_for_dollchan_pref_changed(){
      if (pref.workaround_for_dollchan == true) {
        pref.workaround_for_dollchan = false;
        pref.wafd_tb = (pref.wafd_tb=='tb')? 'reply' : 'tb';
        on_change_workaround_for_dollchan(null);
        pref.workaround_for_dollchan = true;
        pref.wafd_tb = (pref.wafd_tb=='tb')? 'reply' : 'tb';
        on_change_workaround_for_dollchan(null);
      }
      open_spoiler();
    }
    function on_change_workaround_for_dollchan_2(){
      var inputs = document.getElementsByTagName('input');
      var files = [];
      for (var i=0;i<inputs.length;i++) if (inputs[i].type=='file') files.push(inputs[i]);
      var grand_parent = document.getElementById('postform_row_files');
      var parent;
      for (var i=0;i<grand_parent.childNodes.length;i++) if (grand_parent.childNodes[i].align=='left') parent = grand_parent.childNodes[i];
//      for (var i=0;i<4;i++) for (var j=0;j<4;j++) if (files[i].name==('file_'+j)) parent.childNodes[i].appendChild(files[i]);
      for (var i=0;i<files.length;i++) {
        var no = parseInt(files[i].name.replace(/file_/,""));
        parent.childNodes[no].appendChild(files[i]);
//        parent.childNodes[no].style.display = '';
//        files[i].addEventListener('change', on_change_workaround_for_dollchan_3, false);
        var evt = document.createEvent('UIEvents');
        evt.initUIEvent('change', false, true, window, 1);
        files[i].dispatchEvent(evt);
      }

//      var images = images = document.getElementsByClassName('de-file-img');
//      var thumbnails = [];
//      for (var i=0;i<images.length;i++) if (images[i].tagName=='IMG') thumbnails.push(images[i]);
      var thumbnails_parent = document.getElementById('postform_label_comment');
      var show_thumbnails = true;
      for (var i=0;i<files.length;i++) {
//        if (files[i].value=='' && thumbnails[i]!=undefined) thumbnails[i].parentNode.removeChild(thumbnails[i]);
        if (files[i].value=='') {
          var thumbnail = thumbnails_parent.getElementsByTagName('img')[0];
          if (thumbnail!=undefined) thumbnail.parentNode.removeChild(thumbnail);          
        }
        if (files[i].value!='' || show_thumbnails) {
          thumbnails_parent.childNodes[i].style.display = '';
          if (files[i].value=='') show_thumbnails = false;
        } else thumbnails_parent.childNodes[i].style.display = 'none';
//        console.log(i + ': '+ files[i].value);
      }
    }
//    function on_change_workaround_for_dollchan_3(){
//      console.log('change');
//    }
    if (pref.workaround_for_dollchan == true) on_change_workaround_for_dollchan(false); // initial

    var spoiler_org = null;
    var rule = [];
    function open_spoiler(){
      if (pref.wafd_open_spoiler == true) {
        rule = [];
        for (var j=0;j<document.styleSheets.length;j++)
          for (var i=0;i<document.styleSheets[j].cssRules.length;i++)
            if (document.styleSheets[j].cssRules[i].selectorText && document.styleSheets[j].cssRules[i].selectorText.search(/spoiler/)!=-1) rule.push(j,i)
        if (document.styleSheets[rule[0]].cssRules[rule[1]].selectorText.search(/hover/)!=-1) {rule.push(rule.shift());rule.push(rule.shift());}
        spoiler_org = document.styleSheets[rule[0]].cssRules[rule[1]].style.cssText;
        document.styleSheets[rule[0]].cssRules[rule[1]].style.cssText = document.styleSheets[rule[2]].cssRules[rule[3]].style.cssText;
      } else if (spoiler_org!=null) document.styleSheets[rule[0]].cssRules[rule[1]].style.cssText = spoiler_org;
    }
    if (pref.wafd_open_spoiler == true) open_spoiler(); // initial
    return{
//      on_change_workaround_for_dollchan: function(exe){on_change_workaround_for_dollchan(exe);},
      workaround_for_dollchan_pref_changed: function(){workaround_for_dollchan_pref_changed();}
    }
  }

  function make_post_form_obj(pn9){
//  var post_form = (function(){
//    var pn9 = div_init(9,'120px','30px','button','post_form');
//    var pn9 = cnst.init('left:120px:bottom:30px:button:post_form:Show');
    pn9.addEventListener('click', show_hide, false);
    var pn10 = null;
    var pn10_2 = null;
//    var pn10_2 = cnst.add_to_tb(pn10,'<input type="checkbox">workaround for dollchan<input type="checkbox">prevent redirection');
//    var pn10_2 = document.createElement('div');
//    pn10_2.style.float = 'right'; // doesn't work on FF
//    pn10_2.innerHTML = '<input type="checkbox">workaround for dollchan<input type="checkbox">prevent redirection'
//    var prevent_redirection = pn10_2.childNodes[2];
//    prevent_redirection.onchange = on_change_redirection;
//    var workaround_for_dollchan = pn10_2.childNodes[0];
//    workaround_for_dollchan.onchange = on_change_workaround_for_dollchan;
    var prevent_redirection;
    var workaround_for_dollchan;
    var parent;
    var no;
    var on = false;
    var hidden_elements = [];
    var activated = false;
    function show_hide(){
      if (!activated && site2[site.nickname].postform_activation) {site2[site.nickname].postform_activation(); activated=true;}
      var tgt    = site.postform;
      if (!on) {
        if (pn10==null) {
          pn10 = cnst.init('left:0px:tile:get:bottom:overflow:hidden:Show:tb',function(){site.postform_comment.focus();},cnst.void_func,show_hide,cnst.void_func)[0];
          pn10.id = 'pn10_debug';
//          pn10_2 = cnst.add_to_tb(pn10,'<input type="checkbox" name="workaround_for_dollchan">workaround for dollchan<input type="checkbox" name="prevent_redirection">prevent redirection');
          pn10_2 = cnst.add_to_tb(pn10,'<input type="checkbox" name="prevent_redirection">prevent redirection');
          pref_func.apply_prep(pn10_2,false);
//          prevent_redirection = pn10_2.childNodes[2];
          prevent_redirection = pn10_2.childNodes[0];
          prevent_redirection.onchange = on_change_redirection;
//          workaround_for_dollchan = pn10_2.childNodes[0];
//          workaround_for_dollchan.onchange = on_change_workaround_for_dollchan;
//          pn10.childNodes[0].insertBefore(pn10_2,pn10.childNodes[0].childNodes[2]);
//          if (brwsr.ff)  pn10.childNodes[0].childNodes[2].style.float = 'right'; // doesn't work
//          if (brwsr.ff) pn10.childNodes[0].childNodes[2].outerHTML = pn10.childNodes[0].childNodes[2].outerHTML.replace(/<div/,"<div style=\"float: right\""); // discard events configuration
//          if (brwsr.ff) pn10.childNodes[0].childNodes[2].setAttribute('style','float: right');
          pn10.childNodes[1].innerHTML = '<div style="display: none"></div><div></div>';
//          options.func0_prep(pn10.childNodes[1].childNodes[0],pn10.childNodes[0]);
          options.func0_prep(pn10.childNodes[1].childNodes[0],pn10);
        }
        parent = tgt.parentNode;
        no = 0;
        while (parent.childNodes[no]!=tgt && no < parent.childNodes.length) no++;
        pn10.childNodes[1].childNodes[1].appendChild(tgt);
        site.root_body.appendChild(pn10);
        var labels = document.getElementsByClassName('label');
        for (var i=0;i<labels.length;i++) {
          if (labels[i].innerHTML=="Go to:" || labels[i].innerHTML=="Password:") {
            if (labels[i].parentNode.style.display != 'none'){
              labels[i].parentNode.style.display = 'none';
              hidden_elements.push(labels[i].parentNode);
            }
          }
        }
        if (site.postform_rules!=null) {
          site.postform_rules.style.display = 'none';
          hidden_elements.push(site.postform_rules);
        }
        site.postform_comment.focus();
        cnst.bottom_top(pn10);
      } else {
        while (hidden_elements.length!=0) hidden_elements.pop().style.display = '';
        site.root_body.removeChild(pn10);
        parent.insertBefore(tgt,parent.childNodes[no]);
      }
      on = !on;
    }
//    pn10.childNodes[0].childNodes[0].childNodes[0].onclick = rollup;
//    pn10.childNodes[0].childNodes[0].childNodes[1].onclick = function(){opacity(false);};
//    pn10.childNodes[0].childNodes[0].childNodes[2].onclick = function(){opacity(true);};
//    var prevent_redirection = pn10.childNodes[0].childNodes[2].childNodes[2];
//    pn10.childNodes[0].childNodes[2].childNodes[2].onchange = on_change_redirection;
//    var workaround_for_dollchan = pn10.childNodes[0].childNodes[2].childNodes[0];
//    pn10.childNodes[0].childNodes[2].childNodes[0].onchange = on_change_workaround_for_dollchan;
//    pn10.childNodes[0].childNodes[1].childNodes[0].onclick = show_hide;
//    pn10.childNodes[0].childNodes[3].ondblclick = rollup;
//    var rolluped = false;
//    function rollup(){
//      if (rolluped) {
//        pn10.style.height = ''; // means 'auto'
//        pn10.style.width = ''; // for dollchan
//        pn10.childNodes[1].style.display = ''; // for dollchan
//        site.postform_comment.focus();
//      } else {
//        pn10.style.height = pn10.childNodes[0].offsetHeight + 'px';
//        pn10.style.width = pn10.offsetWidth + 'px'; // for dollchan
//        pn10.childNodes[1].style.display = 'none'; // for dollchan
////        comment.addEventListener('change', rollup, false); // 'change' fires when outfocused.
////        comment.addEventListener('keydown', rollup, false);
////        comment.addEventListener('blur', rollup, false);
//      }
//      rolluped = !rolluped;
//    }
//    pn10.style.opacity = 1;
//    function opacity(increase){
//      var op = parseFloat(pn10.style.opacity);
//      if (increase) pn10.style.opacity = (op+0.1>=1)? 1 : op+0.1;
//      else if (!increase) pn10.style.opacity = (op-0.1<=0.1)? 0.1: op-0.1;
//    }
//    var dock = pn10.childNodes[0].childNodes[0].childNodes[3];
//    pn10.addEventListener('resize', pn10_resize, false);
//    pn10.addEventListener('mousedown', pn10_mousedown, false);
//    pn10.addEventListener('mouseup', pn10_resize, false);
//    var pn10_size;
//    function pn10_mousedown(e){
//      console.log('size');
//      pn10_size = [pn10.style.width, pn10.style.height];
//    }
//    function pn10_resize(e){
//      console.log('resize');
//      if (dock.checked && (pn10.style.width!=pn10_size[0] || pn10.style.height!=pn10_size[1])) {
//        var width_increase  = parseInt(pn10.style.width.replace(/px/,''))  - parseInt(pn10_size[0].replace(/px/,''));
//        var height_increase = parseInt(pn10.style.height.replace(/px/,'')) - parseInt(pn10_size[1].replace(/px/,''));
//        var comment = site.postform_comment;
//        comment.style.width  = (parseInt(comment.style.width.replace(/px/,'')) + width_increase) + 'px';
//        comment.style.height = (parseInt(comment.style.height.replace(/px/,'')) + height_increase) + 'px';
//      }
//    }

//    function show_hide(){
//      pn10 = prep_pn10(pn10==null);
//    }
//    function prep_pn10(make){
//      if (make) {
////        pn10.innerHTML = document.getElementsByName('postform')[0].innerHTML;
//        pn10.appendChild(tgt);
//      } else {
////        pn10.removeChild(tgt); // not required.
//        pos_size = pos_get_set(true);
////        parent.appendChild(tgt);
//        parent.insertBefore(tgt,parent.childNodes[no]);
//      }
//      if (make) return pn10;
//      else return div_destroy(pn10);
//    }
//    function pos_get_set(get){
//      var comment = site.postform_comment;
//      if (get) return [pn10.style.left, pn10.style.bottom, pn10.style.width, pn10.style.height, comment.style.width, comment.style.height];
//      else {
//        pn10.style.width = pos_size[2];
//        pn10.style.height = pos_size[3];
//        comment.style.width = pos_size[4];
//        comment.style.height = pos_size[5];
//      }
//    }
//    function on_unload(){
//      var x = document.documentElement.scrollLeft || document.body.scrollLeft;
//      var y = document.documentElement.scrollTop || document.body.scrollTop;
//      var store_val = [(pn10!=null), x, y, pos_get_set(true)];
//      sessionStorage.post_form_pref = JSON.stringify(store_val);
//      window.removeEventListener('unload', on_unload, false);
//    }
//    if (sessionStorage.post_form_pref) {
//      var store_val = JSON.parse(sessionStorage.post_form_pref);
//      scrollTo(store_val[1],store_val[2]);
//      if (store_val[0]) {
//        show_hide();
//        pos_size = store_val[3];
//        pos_get_set(false);
//      }
////      sessionStorage.removeItem('post_form_pref');
//    }
//    window.addEventListener('unload', on_unload, false);
//    var posted = false;
//    var inputs = document.getElementsByTagName('input');
//    var button_del;
//    for (var i=0;i<inputs.length;i++) if (inputs[i].type=='submit' && inputs[i].value=="Delete") button_del = inputs[i];
//    button_del.addEventListener('click', function(){posted = true;}, false);
//    site.postform_submit.addEventListener('click', function(){posted = true;}, false);
//    window.addEventListener('beforeunload', on_beforeunload, false);
//    function on_beforeunload(e){
//      if (posted) e.returnValue = 'You are attempting to update. Please choose "No" when you use "autoupdater".';
//      posted = false;
//    }


    var submits = [];
    var forms_post = [];
    var forms = document.getElementsByTagName('form');
//    for (var i=0;i<forms.length;i++) if (forms[i].method!='post') forms.splice(i,1); // post, delete, report // doesn't work.
    for (var i=0;i<forms.length;i++) if (forms[i].method=='post') forms_post.push(forms[i]); // post, delete, report
    for (var i=0;i<forms_post.length;i++) {
      var inputs = forms_post[i].getElementsByTagName('input');
      for (var j=0;j<inputs.length;j++) if (inputs[j].type=='submit') submits.push(inputs[j]);
    }
//    var posted = [];
//    for (var i=0;i<submits.length;i++) {posted.push(false); submits[i].addEventListener('click', function(){posted[i] = true;}, false);} // doesn't work because of closure.
//    for (let i=0;i<submits.length;i++) {posted.push(false); submits[i].addEventListener('click', function(){posted[i] = true;}, false);} // 'let' can't be used in chrome script.
    var posted = false;
    var targets = [];
    for (var i=0;i<submits.length;i++) submits[i].addEventListener('click', function(){posted = true;}, false);
//    window.addEventListener('beforeunload', on_beforeunload, false);
    function on_change_redirection(){
//      pref.prevent_redirection = prevent_redirection.checked;
      if (pn10_2!=null) pref_func.apply_prep(pn10_2,true);
      if (pref.prevent_redirection == true) {
        for (var i=0;i<submits.length;i++) {
          targets[i] = forms[i].target;
          forms[i].target = 'redirect_target';
        }
      } else for (var i=0;i<submits.length;i++) forms[i].target = targets[i];
    }
    if (pref.prevent_redirection == true) on_change_redirection(); // initial
//    function on_beforeunload(e){ // doesn't work. too late?
//      if (prevent_redirection.checked == true) {
//        console.log('beforeunload: ' + e);
////        for (var i=0;i<submits.length;i++) {
////          if (posted[i]) forms[i].target = 'rediret_target';
////          posted[i] = false;
////        }
//        if (posted) for (var i=0;i<submits.length;i++) {
//          targets[i] = forms[i].target;
//          forms[i].target = 'redirect_target';
//        }
//      }
//    }

//    function on_change_workaround_for_dollchan(){
////      pref.workaround_for_dollchan = workaround_for_dollchan.checked;
//      if (pn10_2!=null) pref_func.apply_prep(pn10_2,true);
//      if (pref.workaround_for_dollchan == true) {
////        document.getElementById('postform_row_files').style.display = '';
////        var tmp = document.getElementsByTagName('input');
////        for (var i=0;i<tmp.length;i++) if (tmp[i].type=='file') tmp[i].parentNode.style.display = '';
//        if (pn10_2!=null) on_change_workaround_for_dollchan_2(); // temporarily.
//        if (pref.wafd_tb=='tb') document.getElementById('postform_label_comment').addEventListener('mouseout', on_change_workaround_for_dollchan, false);
//        else site.postform_submit.addEventListener('mouseenter', on_change_workaround_for_dollchan, false);
//      } else {
////        document.getElementById('postform_row_files').style.display = 'none';
//        if (pref.wafd_tb=='tb') document.getElementById('postform_label_comment').removeEventListener('mouseout', on_change_workaround_for_dollchan, false);
//        else site.postform_submit.removeEventListener('mouseenter', on_change_workaround_for_dollchan, false);
//      }
//    }
//    if (pref.workaround_for_dollchan == true) on_change_workaround_for_dollchan(); // initial
//    function on_change_workaround_for_dollchan(){
//      if (pn10_2!=null) pref_func.apply_prep(pn10_2,true);
//      wafd.on_change_workaround_for_dollchan(true);
//    }
//    if (pref.workaround_for_dollchan == true) wafd.on_change_workaround_for_dollchan(false); // initial

//    function on_change_workaround_for_dollchan_2(){
//      var inputs = document.getElementsByTagName('input');
//      var files = [];
//      for (var i=0;i<inputs.length;i++) if (inputs[i].type=='file') files.push(inputs[i]);
//      var grand_parent = document.getElementById('postform_row_files');
//      var parent;
//      for (var i=0;i<grand_parent.childNodes.length;i++) if (grand_parent.childNodes[i].align=='left') parent = grand_parent.childNodes[i];
////      for (var i=0;i<4;i++) for (var j=0;j<4;j++) if (files[i].name==('file_'+j)) parent.childNodes[i].appendChild(files[i]);
//      for (var i=0;i<files.length;i++) {
//        var no = parseInt(files[i].name.replace(/file_/,""));
//        parent.childNodes[no].appendChild(files[i]);
////        parent.childNodes[no].style.display = '';
////        files[i].addEventListener('change', on_change_workaround_for_dollchan_3, false);
//        var evt = document.createEvent('UIEvents');
//        evt.initUIEvent('change', false, true, window, 1);
//        files[i].dispatchEvent(evt);
//      }
//
////      var images = images = document.getElementsByClassName('de-file-img');
////      var thumbnails = [];
////      for (var i=0;i<images.length;i++) if (images[i].tagName=='IMG') thumbnails.push(images[i]);
//      var thumbnails_parent = document.getElementById('postform_label_comment');
//      var show_thumbnails = true;
//      for (var i=0;i<files.length;i++) {
////        if (files[i].value=='' && thumbnails[i]!=undefined) thumbnails[i].parentNode.removeChild(thumbnails[i]);
//        if (files[i].value=='') {
//          var thumbnail = thumbnails_parent.getElementsByTagName('img')[0];
//          if (thumbnail!=undefined) thumbnail.parentNode.removeChild(thumbnail);          
//        }
//        if (files[i].value!='' || show_thumbnails) {
//          thumbnails_parent.childNodes[i].style.display = '';
//          if (files[i].value=='') show_thumbnails = false;
//        } else thumbnails_parent.childNodes[i].style.display = 'none';
////        console.log(i + ': '+ files[i].value);
//      }
//    }
////    function on_change_workaround_for_dollchan_3(){
////      console.log('change');
////    }

//    var pn11 = div_init(11,'100px','100px','div');
//    pn11.style.display = 'none';
    var pn11 = cnst.init('left:100px:bottom:100px:display:none:Show');
    pn11.id = 'pn11_debug';
    pn11.addEventListener('click', function(){on_load('parent_click');}, false);
    // delete contents for preventing from getting new posts by auto-updater.
//    function pn11_init(){ // works on Chrome, but causes infinite loop on FF.
      pn11.innerHTML = '<iframe name="redirect_target" id="redirect_target"></iframe>';
////      document.getElementsByName('redirect_target')[0].setAttribute('onload','alert("AAA");return false;'); // work
////      document.getElementsByName('redirect_target')[0].setAttribute('onload','on_load();'); // fail;
////      document.getElementsByName('redirect_target')[0].onload  = function(){on_load('child_load')}; // work
////      document.getElementsByName('redirect_target')[0].onclick = function(){on_load('child_click')}; // for debug.
      pn11.childNodes[0].onload  = function(){on_load('child_load')}; // work
      pn11.childNodes[0].onclick = function(){on_load('child_click')}; // for debug.
//    }
//    pn11_init();
    function on_load(from_where){
      console.log('load: '+from_where);
      site.postform_submit.disabled = false;
//      top.redirect_target.document
//      if (posted) for (var i=0;i<submits.length;i++) forms[i].target = targets[i];
//      posted = false;
//      if (pn11.style.display=='none') pn11_init();
//      if (pn11.style.display=='none') frames['redirect_target'].location.replace('about:blank');
      if (pn11.style.display=='none') if (frames['redirect_target'].location.href!='about:blank') frames['redirect_target'].location.replace('about:blank');
    }
//    var pn11_on = false;
    function debug(){
//      if (!pn11_on) site.root_body.appendChild(pn11);
//      else site.root_body.removeChild(pn11); // can't prevent redirection.
      if (pn11.style.display=='none') pn11.style.display = '';
      else {
        pn11.style.display = 'none';
//      pn11_on = !pn11_on;
//      frames['redirect_target'].document.open();
//      frames['redirect_target'].document.write('deleted');
//      frames['redirect_target'].document.close();  // delete contents for preventing from getting new posts by auto-updater.
//        pn11_init();
        if (frames['redirect_target'].location.href!='about:blank') frames['redirect_target'].location.replace('about:blank');
      }
    }

//// working code
//    var pn11 = div_init(11,'100px','100px','div');
//    pn11.id = 'pn11_debug';
//    pn11.innerHTML = '<iframe name="redirect_target" id="redirect_target"></iframe>'
//    pn11.addEventListener('click', function(){on_load('parent_click');}, false);
////    document.getElementsByName('redirect_target')[0].setAttribute('onload','alert("AAA");return false;'); // work
////    document.getElementsByName('redirect_target')[0].setAttribute('onload','on_load();'); // fail;
//    document.getElementsByName('redirect_target')[0].onload  = function(){on_load('child_load')};
//    document.getElementsByName('redirect_target')[0].onclick = function(){on_load('child_click')}; // for debug.
//    var forms = document.getElementsByTagName('form');
//    for (var i=0;i<forms.length;i++) {
//      if (forms[i].method=='post') forms[i].target = 'redirect_target'; // post, delete, report
//    }
////    window.addEventListener('load', on_load, false);
//    pn11.addEventListener('load', on_load, false);
////    pn11.redirect_target.addEventListener('load', on_load, false);
//    function on_load(from_where){
//      console.log('load: '+from_where);
//      site.postform_submit.disabled = false;
////      top.redirect_target.document
//    }
    return {
      debug: function(){debug();}
    }
//  })();
  };


  var pn_debug = 0;
//  var pn_debug_button = div_init(-1,'200px','30px','button','debug');
//  var pn_debug_button = cnst.init('left:200px:bottom:30px:button:debug:Show');
//  var pn_debug_out    = div_init(2,'200px','50px','txt','debug_out');
//  var pn_debug_out    = cnst.init('left:200px:bottom:50px:txt:debug_out');
  function make_debug_obj(pn_debug_button){
    pn_debug_button.addEventListener('click', debug, false);
    function debug(e){
      console.log('debug');
      if (site.postform_submit!=null) site.postform_submit.disabled = false;
//      pn_debug_out.textContent += 'debug';
      if (post_form_obj) post_form_obj.debug();
//      worker.port.postMessage("Scott");
//      worker.port.postMessage(JSON.stringify(['SET','test2','Scott']));
//      worker.port.postMessage(JSON.stringify(['GET','test2']));
//      var str = timer_obj.timer().timer().req.responseText;
//      console.log(str);
//      worker.port.postMessage(JSON.stringify(['ECHO','ON']));
//      brwsr.sw_cache.setItem(site.nickname+site.board+'0',JSON.stringify([cnst.get_time(), str]));

    }
  }

  if (brwsr.sw_cache && window.SharedWorker && (pref.info_server || pref.info_client)) brwsr.sw_cache = (function(){
// working code.
//    script = 'self.onmessage = function(e){self.postMessage(e.data);};'
//    var blob = new Blob([script], {type: 'text/javascript'});
//    var blobURL = URL.createObjectURL(blob);
//    var echoWorker = new unsafeWindow.Worker(blobURL);
//    URL.revokeObjectURL(blobURL);
//    echoWorker.onmessage = function (oEvent) {
//      console.log("Worker said : " + oEvent.data);
//    };
//    echoWorker.postMessage("ali");

    var worker = null;
    var sw_alive = false;
    var url = (localStorage)? localStorage[pref.script_prefix+'.backing_store'] : null; // should use cookie instead of localStorage.
    if (url!==null) prep_sw(url);
    function prep_sw(blobURL) {
      if (blobURL==undefined) {
        var script = '\
          var ports = [];\
          var store = {};\
          var connections = 0;\
          self.addEventListener("connect", function(e){\
            var port = e.ports[0];\
            var no = connections++;\
            var func = function(e){msg_parser(e,port,no)};\
            port.addEventListener("message", func, false);\
            port.start();\
            port.postMessage(JSON.stringify(["INFO","Connected: #" + no]));\
            ports.push({port:port, func:func, echo:true, subscribe:false});\
          }, false);\
          function msg_parser(e,port,no){\
            if (ports[no].echo) port.postMessage(e.data);\
            var fields = JSON.parse(e.data);\
            if (fields[0]=="ECHO") ports[no].echo = fields[1];\
            else if (fields[0]=="GET") port.postMessage(JSON.stringify(["ACK",fields[1],store[fields[1]]]));\
            else if (fields[0]=="CLOSE") {\
              port.removeEventListener("message", ports[no].func, false);\
              ports[no] = null;\
            }\
/*            else if (fields[0]=="SET") store[fields[1]]=fields[2];*/\
            else if (fields[0]=="SET") {\
              var old_val = store[fields[1]];\
              if (old_val!=fields[2]) {\
                var msg = JSON.stringify(["EVENT",fields[1]]);\
                for (var i=0;i<ports.length;i++)\
                  if (i==no) store[fields[1]]=fields[2];\
                  else if (ports[i] && ports[i].subscribe) ports[i].port.postMessage(msg);\
              }\
            } else if (fields[0]=="STAT") stat_post(port,"STAT_ACK",fields[1]);'+
           'else if (fields[0]=="SUBSCRIBE") ports[no].subscribe = fields[1];'+
         '}'+
         'var gc = setInterval(gc_func, 600000);'+
         'function gc_func(){'+
           'var date = Date.now() - 3600000;'+
           'for (var i in store) if (store[i].date < date) delete store[i];'+
//           'stat_post(ports[0].port,"STAT_REP",false);'+
//           'for (var i in store) ports[0].port.postMessage(JSON.stringify([i,store[i].date,store[i].date-date]));'+
         '}'+
         'function stat_post(port,str,dump){'+
           'var live = 0;'+
           'for (var i=0;i<ports.length;i++) if (ports[i]) live++;'+
//           'var count = 0;'+
//           'for (var i in store) count++;'+
//           'var msg = JSON.stringify([str,"Connected: "+live+"/"+connections+", Stored: "+count]);'+
           'var msg = JSON.stringify([str,"Connected: "+live+"/"+connections+", Stored: "+Object.keys(store).length]);'+
           'port.postMessage(msg);'+
           'var count = 0;'+
           'if (dump) for (var i in store) port.postMessage(JSON.stringify(["DUMP_ACK",(count++)+": "+i+", "+JSON.stringify(store[i])]));'+
         '}\
        ';
        var blob = new Blob([script], {type: 'text/javascript'});
        blobURL = URL.createObjectURL(blob);
        localStorage[pref.script_prefix+'.backing_store'] = blobURL;
      }
      try {
        worker = new unsafeWindow.SharedWorker(blobURL); // FF throws exception when blobURL is invalid. But chorome doesn't throw.
//        worker = new unsafeWindow.SharedWorker('blob:https%3A//krautchan.net/87996484-6a43-44c8-ab11-efe455fd2b2b');
//        URL.revokeObjectURL(blobURL); // Chrome need several secondss to invoke. If you place this here, it doesn't work on chrome.
        worker.port.addEventListener('message', sw_out, false);
//        worker.port.addEventListener('message', sw_get, false);
        worker.port.addEventListener('message', sw_tryget, false);
        worker.port.start();
//        worker.port.postMessage("Alyssa");
//        worker.port.postMessage(JSON.stringify(['ECHO','Alyssa']));
//        worker.port.postMessage(JSON.stringify(['SET','test0','val_0']));
//        worker.port.postMessage(JSON.stringify(['SET','test1','val_1']));
//        worker.port.postMessage(JSON.stringify(['GET','test0']));
//        worker.port.postMessage(JSON.stringify(['GET','test1']));
//        console.log(url);
      } catch(e) {
//        console.log('catch error at making worker');
        prep_sw(undefined);
      }
    }
    function sw_out(e){
//      alert('Worker said : ' + e.data);
//      console.log('Worker said : ' + e.data);
      console.log(new Date().toLocaleTimeString() + ', Worker said : ' + e.data.substr(0,120));
      if (!sw_alive) {
        worker.port.postMessage(JSON.stringify(['STAT']));
//        worker.port.postMessage(JSON.stringify(['STAT',true]));
        if (!pref.debug_mode['0']) worker.port.postMessage(JSON.stringify(['ECHO',false]));
//        worker.port.postMessage(JSON.stringify(['ECHO',true]));
//        worker.port.postMessage(JSON.stringify(['ECHO',false]));
        window.addEventListener('beforeunload',
          function(){
            worker.port.postMessage(JSON.stringify(['CLOSE']));
            worker.port.close();
          }, false);
      }
      sw_alive = true;
      if (!pref.debug_mode['0']) worker.port.removeEventListener('message', sw_out, false);
    }
    if (!brwsr.ff) setTimeout(function(){
//      console.log('alive = '+ sw_alive);
      if (url!==null && !sw_alive) {
        worker.port.removeEventListener('message', sw_out, false);
        worker.port.close();
        prep_sw(undefined);
      }
    },5000);
//    var store = [];
//    function sw_get(e){
//      var fields = JSON.parse(e.data);
//      if (fields[0]=="ACK") store[fields[1]]=fields[2];
//    }
    var callbacks = [];
    var tryget_ids = [];
    var fields = null; // static object for scan.
    function sw_tryget(e){
      fields = JSON.parse(e.data);
      if (fields[0]=="ACK") {
        var key = fields[1];
        clearTimeout(tryget_ids[key]);
        if (callbacks[key]) {
          callbacks[key][0](key,fields[2],callbacks[key][1]); // callback with value.
          delete callbacks[key];
        }
      } else if (fields[0]=="EVENT") {
        if (pref.info_client && fields[1].search(info_raw)!=-1 && fields[1].substr(info_raw.length,1)=='p') {
          var page_no = fields[1].substr(info_raw.length+1);
          var timer = (timer_obj)? timer_obj.timer() : null;
          if (timer!=null) {
//            var value = JSON.parse(fields[2]);
//            timer.page_check4(value[0], page_no, new DOMParser().parseFromString(value[1],'text/html'));
            brwsr.sw_cache.trygetItem(fields[1],timer.page_check5);
          }
        }
        if (pref.info_client && catalog_obj && catalog_obj.catalog_func()!=null && pref.catalog_snoop_refresh)
          catalog_obj.catalog_func().catalog_insert(fields[1]);
      }
      fields = null;
    }
    function tryget_timeout(key){ // timeout is sequential always.
      callbacks[key][0](key,null,callbacks[key][1]); // callback with null.
      delete callbacks[key];
    }
    return {
      setItem: function(key,value){worker.port.postMessage(JSON.stringify(['SET',key,value]));},
//      getItem: function(key){
//        worker.port.postMessage(JSON.stringify(['GET',key]));
//        while (store[key]==undefined) sleep(0);
//        var retval = store[key];
//        delete store[key];
//        return retval;
//      },
      trygetItem: function(key,callback,args){
        callbacks[key] = [callback,args];
        tryget_ids[key] = setTimeout(function(){tryget_timeout(key);},2000); // timeout 2sec
        worker.port.postMessage(JSON.stringify(['GET',key]));
      },
      subscribe: function(sub){worker.port.postMessage(JSON.stringify(['SUBSCRIBE',sub]));},
      addEventListener: function(){
      }
    }
  })();
  else brwsr.sw_cache = null;

  if ((pref.catalog.embed && site.whereami==='catalog') || (pref.catalog.embed_page && site.whereami==='page')) { //patch
    if (pref.patch.delayed_invoke.use) setTimeout(catalog_obj.show_hide, pref.patch.delayed_invoke.sec*1000);
    else  catalog_obj.show_hide();
  }

// console debug commands for SharedWorker.
//
// var url = localStorage['CatChan.backing_store'];
// var worker = new window.SharedWorker(url);
// worker.port.onmessage = function(e){console.log(e.data.substr(0.120));};
// worker.port.start();
// worker.port.postMessage(JSON.stringify(['STAT']));


//  function test_sw_cache(){
//    sw_cache.setItem('/int/','aaa');
//    sw_cache.trygetItem('/int/',sw_dummy);
//    function sw_dummy(key,val){
//      console.log(key,val);
//    }
//  }
//  setTimeout(test_sw_cache,10000);

// OPTIONS FROM HERE
  options.func0_prep = function(pn,tb){ // schedule poster.
//    var tb_0 = document.createElement('div');
//    tb_0.innerHTML = '<input type="checkbox">show option';
//    tb_0.style.float = 'right';
//    tb.insertBefore(tb_0,tb.childNodes[tb.childNodes.length-1]);
    var tb_0 = cnst.add_to_tb(tb,'<input type="checkbox">show option');
//    tb_0.childNodes[0].onchange = show_hide;
    tb_0.childNodes[0].onchange = function(){cnst.show_hide(pn);};
    pn.innerHTML = '<div style="float:left"><input type="checkbox">autobumper</div><div style="float:right"><input type="button" value="Schedule"><select name="time_sel"><option>at</option><option>later</option></select><input type="time" name="time" value="08:41"></div><div style="float:right"></div>';
    pn.childNodes[1].childNodes[0].addEventListener('click', schedule_post, false);
//    function show_hide(){
//      if (pn.style.display=='none') pn.style.display='';
//      else pn.style.display='none';
//    }
//// working code for relative time.
////    var cd_id = null;
////    var cd_id_m = null;
////    var cd_id_30s = null;
////    var bg_back     = pn.parentNode.style.background;
//////    var bg_back_org = bg_back;
////    var time_to_post;
////    function schedule_post(){
////      if (cd_id==null && cd_id_30s==null) {
//////        pn.childNodes[1].childNodes[0].value = 'Cancel';
////        var sel_id = pn.childNodes[1].childNodes[1].selectedIndex;
////        var time_val = pn.childNodes[1].childNodes[2].value;
////        
////        time_to_post = parseInt(time_val.substr(0,2),10)*3600 + parseInt(time_val.substr(3,2),10)*60;
////        if (sel_id==0) {
////          var time_str = cnst.get_time();
////          time_to_post -= parseInt(time_str.substr(0,2),10)*3600 + parseInt(time_str.substr(3,2),10)*60 + parseInt(time_str.substr(6,2),10);
////        }
////        if (time_to_post<=0) time_to_post += 86400;
////        cd_id = setTimeout(countdown_post_30s,(time_to_post-30)*1000); // NOT ACCURATE. slip 70s for 5h.
////        countdown_m(time_to_post%60);
////        set_background_and_button_value();
//////        pn.parentNode.style.background = '#f5ecf9';
////      } else {
////        if (cd_id    !=null) {clearTimeout(cd_id); cd_id = null;}
////        if (cd_id_m  !=null) {clearTimeout(cd_id_m);cd_id_m = null;}
////        if (cd_id_30s!=null) cd_id_30s = cd_id_30s();
//////        pn.parentNode.style.background = bg_back;
////        cd_txt.innerHTML = '';
//////        pn.childNodes[1].childNodes[0].value = 'Schedule';
////        set_background_and_button_value();
////      }
////    }
////    var cd_txt = pn.childNodes[2];
////    function countdown_m(dec){
////      var str = '';
////      if (time_to_post%60!=0) str = time_to_post%60 + 's';
////      if (time_to_post>=60)   str = Math.round((time_to_post%3600)/60) + 'm' + str;
////      if (time_to_post>=3600) str = Math.round(time_to_post/3600) + 'h' + str;
////      cd_txt.innerHTML = str;
////      time_to_post -= dec;
////      cd_id_m = setTimeout(function(){countdown_m(60);},dec*1000);
////    }
////    function countdown_post_30s(){
////      cd_id_30s = countdown_post(30);
////      clearInterval(cd_id_m);
////      cd_id = null;
////      cd_id_m = null;
////    }

    var cd_id = null;
    var cd_id_s = null;
    var bg_back     = pn.parentNode.style.background;
    var time_at_post;
    function schedule_post(){
      if (cd_id==null && cd_id_s==null) {
        var sel_id = pn.childNodes[1].childNodes[1].selectedIndex;
        var time_val = pn.childNodes[1].childNodes[2].value;
        var hour = parseInt(time_val.substr(0,time_val.indexOf(':')),10);
        var min  = parseInt(time_val.substr(time_val.indexOf(':')+1),10);
        var time_now = Date.now();
        if (sel_id==0) {
          time_at_post = new Date().setHours(hour,min,0);
          if (time_at_post<time_now) time_at_post+=86400*1000;
        } else time_at_post = time_now + (hour*3600+min*60)*1000;
        countdown_m();
      } else {
        if (cd_id  !=null) {clearTimeout(cd_id);cd_id=null;}
        if (cd_id_s!=null) {clearInterval(cd_id_s);cd_id_s=null;}
        cd_txt.innerHTML = '';
      }
      set_background_and_button_value(false);
    }
    var cd_txt = pn.childNodes[2];
    function countdown_m(){
      var time_now = Date.now();
      var time_till_post = time_at_post-time_now;
      if (time_till_post%60000>=1000 && time_till_post>60000) cd_id = setTimeout(countdown_m,time_till_post%60000);
      else if (time_till_post<90000) cd_id = setTimeout(function(){cd_id_s=countdown_post(30);cd_id=null;},time_till_post-30*1000);
      else cd_id = setTimeout(countdown_m,(time_till_post+30000)%60000+30000);
      var str = '';
//      if (time_till_post %60000) str = (time_till_post%60000)/1000 + 's'; // debug
      if (time_till_post %60000>=1000 && time_till_post%60000<=59499) str = Math.round((time_till_post%60000)/1000) + 's';
      if (time_till_post>=59500)   str = Math.floor(((time_till_post+500)%3600000)/60000) + 'm' + str;
      if (time_till_post>=3599500) str = Math.floor( (time_till_post+500)/3600000) + 'h' + str;
      cd_txt.innerHTML = str;
    }

    function countdown_post(sec){
      cd_txt.innerHTML = sec + 's';
      set_background_and_button_value(true);
      return setInterval(countdown_s, 1000);

      function countdown_s(){
        sec -= 1;
        cd_txt.innerHTML = sec + 's';
        if (sec==0) {
//          alert('post at '+ Date());
          var evt = document.createEvent('MouseEvents');
          evt.initUIEvent('click', false, true, window, 1);
          site.postform_submit.dispatchEvent(evt);
          schedule_post(); // cancel procedure
        }
      }
    }

    var autobumper = pn.childNodes[0].childNodes[0];
    autobumper.onchange = function(){set_background_and_button_value(false);};
    function set_background_and_button_value(cd_s){
      var color = (cd_s)? '#ffc0cb' : ((cd_id!=null)? '#f5ecf9' : ((autobumper.checked)? '#e5f4f9' : bg_back));
      pn.parentNode.style.background = color;
      var value = (cd_s || cd_id!=null)? 'Cancel' : 'Schedule';
      pn.childNodes[1].childNodes[0].value = value;
    }
    var timer_deadtime = null;
    options.func0_exe = function(page){
      var posts_itt = document.getElementsByClassName('postreply').length - document.getElementsByClassName('de-post-deleted').length;
      if (parseFloat(page)>=site.max_page-1 && autobumper.checked && timer_deadtime==null && posts_itt < site.autosage) {
//      if (parseFloat(page)>=1 && autobumper.checked && timer_deadtime==null) { // for debug }
        cd_id_s = countdown_post(30);
        timer_deadtime = setTimeout(function(){timer_deadtime=null;},3600*1000); // 1h
      }
    }
  }
// NEXT TIME PASSWORD fDEPJ9Uo
// OPTIONS TO HERE

})();


