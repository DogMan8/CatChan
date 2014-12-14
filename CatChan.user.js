// ==UserScript==
// @name CatChan
// @version 2014.12.14.1
// @description Cross domain catalog for imageboards
// @include http*://*krautchan.net/*
// @include http*://boards.4chan.org/*
// @include http://*.2chan.net/*
// @include http*://8chan.co/*
// @require https://raw.githubusercontent.com/nnnick/Chart.js/master/Chart.js
// ==/UserScript==

(function (){
//  if (window.top != window.self) return; //don't run on frames or iframes
if (window.top != window.self && window.name!='KC' && window.name!='4chan' && window.name!='8chan') return; //don't run on frames or iframes




//  http://stackoverflow.com/questions/9791489/greasemonkey-require-does-not-work-in-chrome
//  http://stackoverflow.com/questions/2246901/how-can-i-use-jquery-in-greasemonkey-scripts-in-google-chrome
//  http://stackoverflow.com/questions/17341122/link-and-execute-external-javascript-file-hosted-on-github

  var brwsr = {
    ff: (navigator.userAgent.indexOf("Firefox") != -1),
    sw_cache: null
  };
  brwsr.innerText  = (!brwsr.ff)? 'innerText' : 'textContent';
  brwsr.Date_parse = (!brwsr.ff)? Date.parse : function(str){return Date.parse(str.replace(/ /,'T'));};
  brwsr.JSON_parse = function(val){ // patch for Tampermonkey.
                       var retval = JSON.parse(val);
//                       if (GM_setValue)
//                       if (typeof(retval)==='object')
//                       for (var i in retval) if (typeof(retval[i])==='string' && retval[i].startsWith('[') && retval[i].endsWith(']')) retval[i] = brwsr.JSON_parse(retval[i]);}
                       for (var i in retval) if (typeof(retval[i])==='string' && retval[i].search(/^\[.*\]$/)!=-1) retval[i] = brwsr.JSON_parse(retval[i]);
                       return retval;
                     };

  var pref = pref_default();
  function pref_default() {
    return {
      script_prefix: 'CatChan',
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
      info_server: true,
      info_client: true,
      debug_mode : false,
      wafd_tb: 'tb',
      wafd_open_spoiler: false,
      show_page_fraction : true,
      catalog_max_page: 5,
      catalog_snoop_refresh: true,
      catalog_auto_rollup_when_moving: true,
      catalog_size_width: 240,
      catalog_size_height: 350,
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
      catalog_click: 'open',
      catalog_board_list_str: '//sample of board group\n' +
//        '//board_name[,nickname+board_name[+thread No.] | \'*\'+up to X page | \'%\'+style]...\n'+
        '//board_name[,nickname+board_name[+thread No.] | \'*\'+up to X page]...\n'+
        'Global/int/,8chan/int/,KC/int/,4chan/int/\n'+
        'Global/b/,8chan/b/,KC/b/,4chan/b/\n'+
        'v+gg,8chan/v/,8chan/gamergate/,4chan/v/\n'+
        'Interpol,8chan/pol/,4chan/pol/\n'+
        'japan2,/japan2/\n'+
        'script_home,8chan/scriptcdc/,KC/jp/35003,KC/kc/41434\n',
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
      catalog_no_popup_at_expanded : true,
      catalog_open_in_new_tab : true,
      catalog_triage : true,
//      catalog_triage_str : '["background:#e5ecf9","background:#c3dcf9","background:#b8efc2",'+
//        '"background:#efedbe","background:#fbd5fb","background:#fac2c5"]// defalut\n' +
//        '//["background:#e5ecf9;border:none","background:#c3dcf9;border:1px solid #a3bcd9",'+
//        '"background:#b8efc2;border:1px solid #98cfa2","background:#efedbe;border:1px solid #cfcd9e",' +
//        '"background:#fbd5fb;border:1px solid #ebb5db","background:#fac2c5;border:1px solid #daa2a5"]// backgroud+border',
      catalog_triage_str : '//default\n'+
        'KILL,X,,KILL,X,background:#c3dcf9,KILL,X,background:#b8efc2,'+
        'KILL,X,background:#efedbe,KILL,X,background:#fbd5fb,KILL,X,background:#fac2c5\n'+
        'TIME,v,,TIME,v,background:#c3dcf9,TIME,v,background:#b8efc2,'+
        'TIME,v,background:#efedbe,TIME,v,background:#fbd5fb,TIME,v,background:#fac2c5\n'+
        'NONE,O,,NONE,O,background:#c3dcf9,NONE,O,background:#b8efc2,'+
        'NONE,O,background:#efedbe,NONE,O,background:#fbd5fb,NONE,O,background:#fac2c5\n'+
        '// sample\n'+
        '//KILL,back_to_default,,NONE,border,background:#c3dcf9;border:3px solid blue,NONE,transparent,background:,NONE,shrink,width:100px;height:100px\n'+
        '//\n'+
        '// 1st column :\n'+
        '//   KILL : delete forever.\n'+
        '//   TIME : delete until the thread gets new replies.\n'+
        '//   NONE : just change its appearance.\n'+
        '// 2nd column : strings in the button.\n'+
        '// 3rd column : style in HTML.\n'+
        '// Repeat these as you wish.\n',
      catalog_use_named_window : true,
      catalog_cross_domain_connection : 'indirect',
      catalog_auto_update : false,
      catalog_auto_update_period : 10,
      catalog_show_setting : false,
      catalog_t2h_num_of_posts : 5,
      catalog_expand_at_initial : false,
      overwrite_site2_json_str: '//{"site2":{"KC":{"time_offset":2}}} // summer time for KC.',
      overwrite_site2_eval_str: '',
      show_tooltip : true,
      catalog: {
        indexing: 0,
        max_threads : 150,
        filter: {
          show : false,
          kwd      : false,
          kwd_str  : '',
          kwd_re   : false,
          kwd_ci   : false,
          tag      : false,
//          tag_list_str : '',
          tag_scan_auto : false,
          tag_ci   : false,
          time     : false,
          time_str : '',
          time_ago_str : '24:00',
          time_track : false,
          time_mark : false,
          time_mark_str : '',
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
          bookmark_list_rm404 : true,
          load_auto : false,
          save_auto : false,
          kwd_match : 'match',
        },
        tag : {ignore:12, max:12},
        board: {recommendation: true, board_tags: false, ex_list: false, ex_list_str: '', ex_list_obj2: {}},
        style_general_list : true,
        style_general_list_str : 
          '%background:#e5ecf9\n%border:1px solid black\n'+
          '8chan%background:#eef2ff;border:1px solid #d6daf0\n'+
          'KC%background:#e0e0fc;border:1px solid #aaaacc\n'+
          '4chan%background:#ffffee;border:1px solid #f0e0d6\n',
        style_general_list_obj2 : {},
        refresh : {initial : true, except_bt : true},
        on_bt_page : false,
      },
      graph : {key: null, pipe: null},
      uip_tracker: {on : false, posts: true, deletion: true, interval: 10, adaptive: true, auto_open:false, auto_open_th:300, auto_open_kwd:''},
      settings: {indexing: 0},
      tag : {gen: false, gen_str:''} // dummy for checkbox and textarea.
    };
  }

  pref_func = (function(){
    var tooltip = document.createElement('div');
    var tooltip_txt = tooltip.appendChild(document.createTextNode('help'));
//    var tooltip_txt = tooltip.appendChild(document.createElement('textarea'));
    tooltip.style.position = 'fixed';
    tooltip.style.background = '#e5f4f9';
    tooltip.style.color = '#000000';
    tooltip.style.border = '2px solid blue';
    tooltip.style.fontWeight = 'normal';
    var tooltip_on = false;
    return {
      apply_prep: function(pn,set){
        var fm = Array.prototype.slice.call(pn.getElementsByTagName('input'));
        fm = fm.concat(Array.prototype.slice.call(pn.getElementsByTagName('textarea')));
        fm = fm.concat(Array.prototype.slice.call(pn.getElementsByTagName('select')));
//        var fm = pn.getElementsByTagName('*'); // this doesn't work because a select contains its options in it.
        if (fm.length==0) fm = [pn];
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
              if      (typeof(parent[tgt])=='number' ) parent[tgt] = (isNaN(parseInt(fm[i].value,10)))? 0 : parseInt(fm[i].value,10);
              else if (typeof(parent[tgt])=='boolean') parent[tgt] = fm[i].checked;
              else if (typeof(parent[tgt])=='string' ) if (fm[i].checked) parent[tgt] = fm[i].value;
            } else {
              if      (typeof(parent[tgt])=='number' ) fm[i].value = parent[tgt];
              else if (typeof(parent[tgt])=='boolean') fm[i].checked = parent[tgt];
              else if (typeof(parent[tgt])=='string' ) if (parent[tgt] == fm[i].value) fm[i].checked = true;
            }
          }
          if (fm[i].tagName==='TEXTAREA') {
            if (set) {
              parent[tgt] = fm[i].value;
              if (tgt.search(/_str/)!=-1 && parent[tgt.replace(/_str/,'_obj')]) pref_func.str2obj(tgt);
              if (tgt.search(/_str/)!=-1 && parent[tgt.replace(/_str/,'_obj2')]) pref_func.str2obj2(parent,tgt.replace(/_str/,'_obj2'),fm[i].value);
            } else fm[i].value = parent[tgt];
          }
          if (fm[i].tagName==='SELECT') {
            if (set) parent[tgt] = fm[i].selectedIndex;
            else {
              var tgt_obj = tgt.replace(/sel/,'obj');
              if (parent[tgt_obj]) {
                fm[i].length=0;
                for (var j=0;j<parent[tgt_obj].length;j++) {
                  fm[i].length++;
                  fm[i].options[fm[i].length-1].text = parent[tgt_obj][j][0]['key'];
                }
              }
              if (parent[tgt]<fm[i].length) fm[i].selectedIndex = parent[tgt];
            }
          }
        }
        if (sessionStorage && set) sessionStorage.pref = JSON.stringify(pref);
      },
      board_sel : null,
      catalog_board_list_str_or: '',
      catalog_board_list_str_bt: '',
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
        if (typeof(func_obj)!=='function') {
          func_obj.func_default = function(){
            pref_func.apply_prep(this,true);
            if (func_obj[this.name]) func_obj[this.name]();
          };
          call_tgt = func_obj.func_default;
        }
        var fm = pn.getElementsByTagName('*');
        if (fm.length==0) fm = [pn];
        for (var i=0;i<fm.length;i++) {
          if (!fm[i].name) continue;
          if (fm[i].tagName==='INPUT' || fm[i].tagName==='TEXTAREA' || fm[i].tagName==='SELECT') fm[i].onchange = call_tgt;
          if (fm[i].tagName==='BUTTON') fm[i].onclick = call_tgt;
        }
      },
      str2obj: function(key) {
//        var tgt = key+'_obj';
        var tgt = key.replace(/_str/,'_obj');
        pref[tgt] = [];
        tgt = pref[tgt];
        var lines = pref[key].split('\n');
        lines.splice(0,0,(!pref.catalog.on_bt_page)? site.board+','+site.nickname+site.board : site2[site.nickname].boards_sel_from_tags());
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
          lines.push(or);
        }
        if (pref.catalog.board.board_tags && pref_func.catalog_board_list_str_bt!=='') lines.push(pref_func.catalog_board_list_str_bt);
        bn = -1;
        for (var i=0;i<lines.length;i++) {
          var fields = lines[i].replace(/\/\/.*/,'').replace(/, +/g,',').split(',');
          var j=0;
          while (j<fields.length && fields[j]=='') j++;
          if (fields[j]) {
            tgt[++bn] = [];
            tgt[bn][0] = {};
            tgt[bn][0]['key']= fields[j++];
            var idx=0;
            while (j<fields.length) {
              if (fields[j]!==''){
                tgt[bn][++idx] = {};
                tgt[bn][idx]['key'] = fields[j].replace(/[\*%!].*/,'');
                if (fields[j].search(/\*/)!=-1) tgt[bn][idx]['num'   ] = fields[j].replace(/[^\*%!]*[\*%!]/,'').replace(/[%!].*/,'');
                if (fields[j].search(/\%/)!=-1) tgt[bn][idx]['style' ] = fields[j].replace(/[^\*%!]*[\*%!]/,'').replace(/[\*!].*/,'');
                if (fields[j].search(/\!/)!=-1) tgt[bn][idx]['search'] = fields[j].replace(/[^\*%!]*[\*%!]/,'').replace(/[\*%].*/,'');
              }
              j++;
            }
          }
        }
        for (var i=0;i<tgt.length;i++) {
          for (var j=1;j<tgt[i].length;j++) {
            var dm = tgt[i][j]['key'].replace(/\/.*/,'');
            if (dm=='') dm=site.nickname;
            var bd = '/'+ tgt[i][j]['key'].replace(/[^\/]*\//,'').replace(/\/.*/,'') +'/';
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
        var parent = pref;
        var tgt = name;
        if (tgt.indexOf('.')!=-1) {
          var tgts = tgt.split('.');
          for (var j=0;j<tgts.length-1;j++) parent = parent[tgts[j]];
          tgt = tgts[tgts.length-1];
        }
        return [parent,tgt];
      },
      str2obj2: function(parent,key,str){
        parent[key] = {};
        tgt = parent[key];
        var fields = str.replace(/\/\/.*/mg,'').replace(/\n/g,',').split(',');
        for (var i=0;i<fields.length;i++) {
          if (fields[i]=='') continue;
          var name  = fields[i].replace(/[@%].*/,'');
          if (name=='') name = 'DEFAULT';
          var attr  = fields[i].match(/[@%].*/);
          var time  = (attr!=null)? attr[0].replace(/%[^@]*(@|$)/,'').replace(/@/,'') : null;
          var style = (attr!=null)? attr[0].replace(/@[^%]*(%|$)/,'').replace(/%/,'') : null;
          if (tgt[name]===undefined) tgt[name] = {};
          if (time ) tgt[name]['time']  = Date.parse(time) - pref.localtime_offset*3600000;
//          if (style) tgt[name]['style'] = style;
          if (style) {
            tgt[name]['style'] = true;
            var styles = style.split(';');
            for (var j=0;j<styles.length;j++) {
              var stl = styles[j].split(':');
              tgt[name]['style.'+stl[0]] = stl[1];
            }
          }
        }
      },
      obj_init: function(){
        pref_func.str2obj('catalog_board_list_str');
        pref_func.str2obj2(pref.catalog,'style_general_list_obj2',pref.catalog.style_general_list_str);
        pref_func.str2obj2(pref.catalog.board,'ex_list_obj2',pref.catalog.board.ex_list_str);
      },
      pref_overwrite: function(dst,src){
        for (var i in src)
          if (dst[i]!==undefined) 
            if (typeof(src[i])==='object') pref_func.pref_overwrite(dst[i],src[i]);
            else dst[i] = src[i];
      },
      site2_json: function(){
        try { 
          if (pref.overwrite_site2_json_str!=='') {
            var str = pref.overwrite_site2_json_str.replace(/\/\/.*/mg,'').replace(/\n/g,'');
//            if (str!=='') pref_func.pref_overwrite(site2,JSON.parse(str));
            if (str!=='') {
              var obj = JSON.parse(str);
              for (var i in obj)
                if (i==='site2' || i==='pref' || i==='pref_func') pref_func.pref_overwrite(eval(i),obj[i]);
            }
          }
        } catch (e) {
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
      tooltips: {
        func : {},
        add_hier: function(pn){
          var all = pn.getElementsByTagName('*');
//          for (var i=0;i<all.length;i++) if (!pref_func.tooltips.str[all[i].name]) pref_func.tooltips.str[all[i].name] = 'Name: ' + all[i].name;
          for (var i=0;i<all.length;i++) if (all[i].name) pref_func.tooltips.add(all[i]);
        },
        remove_hier: function(pn){
          var all = pn.getElementsByTagName('*');
          for (var i=0;i<all.length;i++) if (all[i].name) pref_func.tooltips.remove(all[i]);
        },
        add: function(elem){
          if (pref_func.tooltips.str[elem.name]) {
            if (pref_func.tooltips.func[elem.name]) pref_func.tooltips.remove(elem.name); // patch for the same name instance.
            pref_func.tooltips.func[elem.name]= [elem, function(e){pref_func.tooltips.show(elem.name,e.clientX,e.clientY)}];
            elem.addEventListener('mouseover',pref_func.tooltips.func[elem.name][1],false);
            elem.addEventListener('mouseout' ,pref_func.tooltips.hide,false);
          }
        },
        remove: function(elem){
          if (pref_func.tooltips.func[elem.name]) {
            var elem = pref_func.tooltips.func[elem.name][0]; // patch for the same name instance.
            elem.removeEventListener('mouseover',pref_func.tooltips.func[elem.name][1],false);
            elem.removeEventListener('mouseout' ,pref_func.tooltips.hide,false);
            delete pref_func.tooltips.func[elem.name];
          }
        },
        show: function(sender,ex,ey){
          tooltip.style.left = ex + 20 + 'px';
          tooltip.style.top  = ey + 20 + 'px';
//          tooltip_txt.value = tooltips[sender];
          tooltip.innerHTML = pref_func.tooltips.str[sender].replace(/\n/mg,'<br>').replace(/  /g,'&emsp;');
          if (!tooltip_on) document.getElementsByTagName('body')[0].appendChild(tooltip);
          tooltip_on = sender;
        },
        hide: function(){
          if (tooltip_on) document.getElementsByTagName('body')[0].removeChild(tooltip);
          tooltip_on = null;
        },
        str : {
          'catalog_triage': '1st row: Hide it forever.\n2nd row: Hide it now, but it will appear again when the thread gets new replies,\n' +
            '  and new replies are marked.\n3rd row: Don\'t hide it, just change its appearance.\n' +
            'Each column shows appearance the thread will get.\n' +
            'Don\'t forget checking \'Exclusive list\' and \'Attribute list\' for using this function.\n' +
            'In other words, you can appear it again by unckecking them.\nAnd you can configure these appearance in \'Attribute list\' and \'Triage styles\'.',
          'catalog_refresh_clear': 'Clear all threads at update.',
          'catalog_promiscuous': 'Gather information whatever.',
          'catalog.filter.kwd_re': 'Regular Expression',
          'catalog.filter.time': 'Time : show threads which have newer posts than the time.',
          'catalog.filter.time_mark': 'Mark: mark newer posts and scrool to them when it\'s opened.',
          'catalog_cross_domain_connection': 'Use \'direct\' if you could, because it\'s quite light, but it doesn\'t work in almost of all environments.\n\'indirect\' usually works well.',
          'debug_mode' : 'Debug mode.',
          'show_tooltip' : 'Show this tooltip.',
          'catalog_board_list_str': 'How to write \'Board groups\'.\n'+
            'Double slash(//) is a beginning of comment.\n'+
            'First column is a name of board groups. The name is shown on the top right corner of catalog and become a key when you store its filter setting to local Storage.\n'+
            'Second or later columns are members. Each member is expressed by \'Identifier\'. Each line becomes each board groups.\n'+
            '\n'+
            'Identifier:\n'+
            'Identifier is a string which contains domain, board and thread. If you don\'t write all of them, it\'ll be interpreted as follows, upper case has priority.\n'+
            '\n'+
            'domain/board/thread\n'+
            '/board/thread\n'+
            'domain/thread\n'+
            'thread\n'+
            'domain/board/\n'+
            '/board/\n'+
            'domain\n'+
            '\n'+
            '\'Board identifier\' must be expressed in a couple of slashes, like \'/int/\'. \'Thread identifier\' must be numeric. If the identifier is a word, how it is treated depends on whether it is a numeric or not.',
          'catalog.style_general_list_str' : 'Identifier%Style_string\n'+
            'Style_string is a string and set to its object.style.XXXX. Therefore you can use all of styles in CSS, which ranges from \'background\' or \'border\' to \'fontSize\', \'width\' or \'height\'\n'+
            'About Identifier, see \'board group\'.',
          'catalog.board.recommendation' : 'Scans \'board announcement\' and gets owner\'s recommendation. This recommendation must be start \'Recommendation: \', and the following part of the line is treated as a line of board groups. The recommendation can be seen in a last line of board groups.',
          'catalog_triage_str' : '// 1st column :\n'+
            '//   KILL : delete forever.\n'+
            '//   TIME : delete until the thread gets new replies.\n'+
            '//   NONE : just change its appearance.\n'+
            '// 2nd column : strings in the button.\n'+
            '// 3rd column : style in HTML.\n'+
            '// Repeat these as you wish.',
          'overwrite_site2_eval_str' : 'For developers. This function is killed by security reason. If you want to use, you must uncomment the function \'pref_func.site2_eval\' by yourself.',
          dummy: ''
        }
      },
      pref_samples : {
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
        pn_samples : null,
        init : function(){
          if (pref_func.pref_samples.pn_samples) return;
          var html = '<button name="backwash">backwash</button>';
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
        onclick_event : function() {
          pref_func.pref_overwrite(pref,pref_func.pref_samples[this.name]);
          for (var i in pref_func.pref_samples[this.name]) {
            var pn = document.getElementsByName(i)[0];
            if (pn) {
              pref_func.apply_prep(pn,false);  // refresh appearance.
              pref_func.apply_prep(pn,true);   // make obj.
            }
          }
        } 
      },
      settings: {
        pn13 : null,
        show_hide : null,
        prep_pn13 : function(){
          var pn13 = cnst.init('left:0px:tile:get:bottom:Show:tb',cnst.void_func,cnst.void_func,pref_func.settings.show_hide,cnst.void_func)[0];
          var pn13_0_2 = cnst.add_to_tb(pn13,
            '<select name="settings.indexing">'+
              '<option>Catalog: General</option>'+
              '<option>Catalog: Board Group</option>'+
              '<option>Catalog: Appearance</option>'+
//              '<option>Statistics:</option>'+
              '<option>UIP tracker for 4chan</option>'+
              '<option>Command Line interface</option>'+
//              '<option>Workaround for dollchan</option>'+
              '<option>General</option>'+
            '</select>');
          pn13_0_2.getElementsByTagName('*')['settings.indexing'].selectedIndex = pref.settings.indexing;
          pref_func.settings.pn13 = pn13; // for onchange func.
          pref_func.settings.onchange_funcs['settings.indexing']();
          pref_func.add_onchange(pn13_0_2,pref_func.settings.onchange_funcs);
          cnst.bottom_top(pn13);
          return pn13;
        },
        destroy_pn13 : function(){
          pref_func.settings.pn13 = cnst.div_destroy(pref_func.settings.pn13, true); // returns null
        },
        htmls: [
          'Catalog:<br>'+
          '&emsp;Cross domain connection:<br>'+
          '&emsp;&emsp;<input type="radio" name="catalog_cross_domain_connection" value="direct"> Direct connection<br>'+
          '&emsp;&emsp;<input type="radio" name="catalog_cross_domain_connection" value="indirect"> Indirect connection<br>'+
          '<!-- &emsp;&emsp;<input type="checkbox" name="catalog_fake_access"> Fake access made by human to avoid poor administration<br>'+
          '&emsp;&emsp;&emsp;(This causes heavier network traffic and server load,<br>'+
          '&emsp;&emsp;&emsp;but administrators can\'t see what script you are using)<br>'+
          '&emsp;Configuration:<br>'+
          '&emsp;&emsp;(To get faster feeling, you should check them all.)<br> -->'+
          '&emsp;Networking: load on demand for reducing initial network traffics<br>'+
          '&emsp;&emsp;<input type="checkbox" name="catalog_draw_on_demand"> Threads<br>'+
          '&emsp;&emsp;<input type="checkbox" name="catalog_load_on_demand"> HTMLs<br>'+
          '&emsp;Localtime offset<input type="text" name="localtime_offset" size="2" style="text-align: right;"><br>'+
          '&emsp;Make a catalog:<br>'+
          '&emsp;&emsp;<input type="checkbox" name="catalog.refresh.initial"> Refresh at initial<br>'+
          '&emsp;&emsp;&emsp;<input type="checkbox" name="catalog.refresh.except_bt"> Except the page of selecting boards\' tag.<br>'+
          '&emsp;Click to:<br>'+
          '&emsp;&emsp;<input type="radio" name="catalog_click" value="open">Go to/open the thread<br>'+
          '&emsp;&emsp;<input type="radio" name="catalog_click" value="expand">Expand/shrink the OP in catalog<br>'+
          '&emsp;&emsp;&emsp;&emsp;<input type="checkbox" name="catalog_expand_at_initial"> Expand at initial<br>'+
          '&emsp;&emsp;&emsp;<input type="checkbox" name="catalog_no_popup_at_expanded"> Don\'t popup when the catalog is expanded<br>'+
          '&emsp;&emsp;<input type="checkbox" name="catalog_open_in_new_tab"> Open the thread in new tab<br>'+
          '&emsp;&emsp;&emsp;<input type="checkbox" name="catalog_use_named_window"> Prevent opening a thread in multiple tabs<br>',
          'Catalog:<br>'+
          '&emsp;Board group configuration:<br>'+
          '&emsp;&emsp;<textarea rows="9" cols="60" name="catalog_board_list_str"></textarea><br>'+
          '&emsp;&emsp;<input type="checkbox" name="catalog.board.recommendation"> Read owner\'s recommendation '+
          '&emsp;&emsp;<button name="tag.recommendation_add">Add to list</button><br>'+
//          '&emsp;&emsp;<input type="button" value="Scan"> Scan board tags<br>'+
//          '&emsp;&emsp;<input type="button" value="Generate" name="tag.generate"> Generate board groups from tags <br>'+
          '&emsp;&emsp;<input type="checkbox" name="catalog.board.board_tags"> Generate board groups from tags '+
          '&emsp;&emsp;<button name="tag.scan">Scan</button><br>'+
          '&emsp;<input type="checkbox" name="catalog.board.ex_list"> Use exclusive list<br>'+
          '&emsp;&emsp;<textarea rows="4" cols="40" name="catalog.board.ex_list_str"></textarea><br>'+
          '&emsp;<input type="checkbox" name="catalog.style_general_list"> Use general style<br>'+
          '&emsp;&emsp;<textarea rows="4" cols="40" name="catalog.style_general_list_str"></textarea><br>'+
          '&emsp;Tagging:<br>'+
          '&emsp;&emsp;Ignore tags latter than <input type="text" name="catalog.tag.ignore" size="2" style="text-align: right;">th in a board/thread<br>'+
          '&emsp;&emsp;Ignore boards/threads which have more than <input type="text" name="catalog.tag.max" size="2" style="text-align: right;"> tags<br>',
          'Catalog:<br>'+
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
          '&emsp;&emsp;<input type="checkbox" name="catalog_footer"> Info(num of posts, images and page)<br>'+
          '&emsp;&emsp;&emsp;<input type="checkbox" name="catalog_footer_br"> always over/under the image<br>'+
          '&emsp;&emsp;<input type="checkbox" name="catalog_popup"> Use pop-up window<br>'+
          '&emsp;&emsp;&emsp;appear/disappear:<br>'+
          '&emsp;&emsp;&emsp;<input type="radio" name="catalog_popdown" value="imm">immediately<br>'+
          '&emsp;&emsp;&emsp;<input type="radio" name="catalog_popdown" value="delay">delayed '+
          '<input type="text" name="catalog_popup_delay" size="6" style="text-align: right;">'+
          '<input type="text" name="catalog_popdown_delay" size="6" style="text-align: right;"> ms<br>'+
          '&emsp;&emsp;&emsp;<input type="checkbox" name="catalog_popup_size_fix"> Fix size when you move it<br>'+
          '&emsp;&emsp;&emsp;<input type="checkbox" name="catalog_localtime"> Localtime<br>'+
          '&emsp;&emsp;Num of posts in thread headline: <input type="text" name="catalog_t2h_num_of_posts" size="3" style="text-align: right;"><br>'+
          '&emsp;&emsp;<input type="checkbox" name="catalog_triage"> Enable triage pop-up<br>'+
          '&emsp;&emsp;&emsp; Style:<textarea rows="1" cols="40" name="catalog_triage_str"></textarea><br>'+
          '<!-- &emsp;<input type="checkbox" name="catalog_enable_cross_board"> Enable cross-board catalog<br> -->'+
          '<!-- &emsp;<input type="checkbox" name="catalog_enable_cross_domain"> Enable cross-domain catalog<br> -->'+
          '<!-- &emsp;&emsp; Cache working in <textarea rows="1" cols="20" name="catalog_sw_domain"></textarea><br> -->',
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
          '&emsp;&emsp;&emsp;OP contains <textarea rows="1" cols="20" name="uip_tracker.auto_open_kwd"></textarea><br>',
          'Command interface for overwriting site preference<br>'+
          '&emsp;<textarea rows="1" cols="40" name="overwrite_site2_json_str"></textarea><br>'+
          '&emsp;<button name="JSON">JSON</button><br>'+
          '&emsp;<textarea rows="1" cols="40" name="overwrite_site2_eval_str"></textarea><br>'+
          '&emsp;<button name="EVAL">EVAL</button><br>',
//          '5',
          'Share loaded html with other tabs to update<br>'+
          '&emsp;<input type="checkbox" name="info_server"> Broadcast loaded html to other tabs (server)<br>'+
          '&emsp;<input type="checkbox" name="info_client"> Listen other tab\'s broadcasting (client)<br>'+
          '<br>'+
          '<input type="checkbox" name="debug_mode"> Debug mode<br>'+
          '<input type="checkbox" name="show_tooltip"> Show tooltips<br>'
        ],
        html_common:
          '<br><button name="close">close</button>'+
          '&emsp;<button name="save">save</button>'+
          '<button name="load_default">load_default</button>'+
          '&emsp;<button name="load_samples">load_samples</button>',
//        onchange_event : function(){
//          pref_func.apply_prep(this,true);
//          if (pref_func.settings.onchange_funcs[this.name]) pref_func.settings.onchange_funcs[this.name]();
//        },
        tag_gen: null,
        tag_obj: null,
        onchange_funcs : {
          'uip_tracker.on' : uip_tracker_init,
          'settings.indexing' : function(){
            var pn13_1 = pref_func.settings.pn13.childNodes[1];
            if (pref.show_tooltip && pn13_1.innerHTML) pref_func.tooltips.remove_hier(pn13_1);
            pn13_1.innerHTML = pref_func.settings.htmls[pref.settings.indexing] + pref_func.settings.html_common;
            pref_func.add_onchange(pn13_1,pref_func.settings.onchange_funcs);
            pref_func.apply_prep(pn13_1,false);
            if (pref.show_tooltip) pref_func.tooltips.add_hier(pn13_1);
          },
          'tag.scan' : function(){
            http_req.get('tag','8chan','https://8chan.co/boards.json',pref_func.settings.onchange_funcs['tag.generate_callback'],false,false);
            pref.catalog.board.board_tags = true;
            pref_func.apply_prep(pref_func.settings.pn13.childNodes[1],false);
          },
          'tag.generate_callback' : function(date,status,response_txt){
            pref_func.settings.tag_obj = JSON.parse(response_txt);
            pref_func.settings.onchange_funcs['tag.re_generate']();
          },
          'tag.re_generate' : function(){
            var str = catalog_obj.scan_tags_common(pref_func.settings.tag_obj,'name="tag.gen"');
            if (!pref_func.settings['tag_gen']) {
              var html = '<div><button name="tag.scan">Refresh</button><br>'+
                '<textarea rows="1" cols="20" name="tag.gen_str"></textarea>'+
                '<button name="tag.gen_add">Add to list</button></div><div>' + str +'</div>';
              cnst.make_popup(pref_func.settings,'tag_gen',html,pref_func.settings.onchange_funcs);
              var pn = pref_func.settings['tag_gen'].childNodes[1];
//              pn.getElementsByTagName('textarea')[0].value='board_group_name';
              pn.style.height = '200px';
              pn.style.width  = '200px';
              pn.style.overflow = 'auto';
              pn.style.resize = 'both';
              cnst.bottom_top(pn);
            } else pref_func.settings['tag_gen'].childNodes[1].childNodes[1].innerHTML = str;
            pref_func.add_onchange(pref_func.settings['tag_gen'].childNodes[1].childNodes[1],pref_func.settings.onchange_funcs);
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
            var obj = pref_func.settings.tag_obj;
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
//              pref_func.apply_prep(pref_func.settings.pn13.childNodes[1],false);
              if (pref_func.settings.pn13) pref_func.apply_prep(pref_func.settings.pn13.childNodes[1],false);
//              pref_func.str2obj('catalog_board_list_str');
//              if (pref_func.board_sel) pref_func.apply_prep(pref_func.board_sel,false);
              pref_func.settings.onchange_funcs['board_sel_refresh']();
            }
          },
          'board_sel_refresh' : function(){
            pref_func.str2obj('catalog_board_list_str');
            if (pref_func.board_sel) pref_func.apply_prep(pref_func.board_sel,false);
          },
          'JSON' : function() {
//            pref_func.apply_prep(pref_func.settings.pn13.getElementsByTagName('TEXTAREA')['overwrite_site2_json_str'],true);
            pref_func.site2_json();
          },
          'EVAL' : function() {
//            pref_func.apply_prep(pref_func.settings.pn13.getElementsByTagName('TEXTAREA')['overwrite_site2_eval_str'],true);
            pref_func.site2_eval();
          },
          'close': function(){pref_func.settings.show_hide();},
          'save' : function(){if (localStorage) localStorage[pref.script_prefix+'.pref']=JSON.stringify(pref);},
          'load_default' : function(){
             var idx = pref.settings.indexing;
             pref = pref_default();
             pref_func.obj_init();
             pref.settings.indexing = idx;
//             pref_func.settings.onchange_funcs['settings.indexing']();
             var pn13_1 = pref_func.settings.pn13.childNodes[1];
             pref_func.apply_prep(pn13_1,false);
             pref_func.apply_prep(pn13_1,true);  // writing to sessionStrage.
          },
          'load_samples' : function(){pref_func.pref_samples.init();}
        }
      }
    };
  })();
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

  var site = { // krautchan/int/
    max_page   : 20,
    autosage   : 300,
    board_name : '/int/',
    url_prefix : 'https://krautchan.net/int/',
    url_prefix2 : {},
    nickname   : 'KC',
    thread_keyword: 'thread',
    postform: document.getElementById('postform'),
    postform_comment: document.getElementById('postform_comment'),
    postform_submit: document.getElementById('postform_submit'),
    postform_rules: document.getElementById('rules_row'),
    get_ops    : null,
    get_posts  : null,
    make_url   : null,
    make_url2  : function(bn,idx){
      var nickname  = (bn.indexOf('/')==0)? site.nickname : bn.substr(0,bn.indexOf('/'));
      var boardname = '/' + bn.replace(/[^\/]*\//,'').replace(/\/.*/,'/');
      return [nickname, boardname, idx, site2[nickname].make_url(boardname,idx)];
    },
    server_name : null, // optional for 2chan.
    protocol : (document.location.href.search(/https/)!=-1)? 'https:' : 'http:',
    catalog_threads_in_page : null,
//    catalog_posts_in_thread : null,
    remove_posts : function(src){return src;},
    remove_files_info : function(src){return src;},
    remove_checkboxes : function(src){return src;},
    get_thread_link : function(src){return '_blank';},
    get_time_of_last_post : function(doc){return null;},
    header_height : 0,
    config     : function(keyword,nickname){ // url='*site/board/etc', keyword='site'
      var href = window.location.href;
      var url_site = href.substr(0,href.indexOf(keyword)+keyword.length);
      var url_board = href.substr(url_site.length+1);
      site.board = '/' + url_board.substr(0,url_board.indexOf('/')+1);
      site.url_prefix = url_site + site.board;
      site.server_name  = href.substr(0,href.indexOf(keyword)-1).replace(/https*:\/\/*/,'');
      site.nickname = nickname;
      site.isthread = window.location.href.search(site2[nickname].thread_keyword)!=-1;
      for (var i in site2[nickname]) site[i] = site2[nickname][i];
      site.features = site2[site.nickname].features;
    },
    features : null,
    owners_recommendation: ''
  };
  site.protocol = (document.location.href.search(/https/)!=-1)? 'https:' : 'http:'; // patch for Tampermonkey.

  var site2 = {};
  site2['DEFAULT'] = { // skeleton for default
    nickname : 'DEFAULT',
    home : '', // home is used url for iframe, so it MUST BE THE SAME ORIGIN, OR LEAVE IT BLANK.
    features : {page: true, graph: true, setting: true, postform: true, catalog: true, listener : true, uip_tracker: false, debug: false},
    check_func : function(){return false;}, // return true if the script is running in this site.
    boards_sel_from_tags : function(){return '';}, // return boards selection strings.
//    catalog_background : '#b5ccf9',
//    catalog_bordercolor : '#000000',
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
//    max_page : 10, // maximum page number.
    make_url : function(board,no){return '_blank';}, // returns URL from board name and page number.
    make_url3: function(board,th){return '_blank';}, // returns URL from board name and thread number.
    get_ops : function(doc){return [];}, // returns array of op numbers from the document.
    get_posts : function(doc) {return [];}, // returns array of posts numbers from the document.
    absolute_link : function(doc){}, // change link from relative to absolute which includes site URL.
    insert_footer : function(thread,page_no,boardname,insert,date,nof_posts,nof_files){return [nof_posts,nof_files];}, // insert information footer, and returns count of posts and images.
    format_thread_layout   : function(thread){}, // formats its layout   for catalog.
    format_thread_style    : function(thread){}, // formats its style    for catalog.
    format_thread_contents : function(thread){}, // formats its contents for catalog.
    format_thread_always   : function(thread){}, // formats its contents for catalog, always executed.
    format_time            : function(thread){}, // formats its timestamp to local time.
    mark_newer_posts       : function(thread,time){return null;},  // mark newer posts, and returns marked first post.
    modify_thread_link     : function(thread){return [];}, // modify thread link and returns information to add event listener.
    preprocess_html        : function(doc_txt){return doc_txt;},  // pre-process document from txt. // cause memory leak.
    preprocess_doc         : function(doc){},  // pre-process document.
    thread2headline : function(doc){return [0,0];},  // make headline from entire thread, returns num of [posts, images].
    add_thread_link : function(doc,url){}, // add link to this thread.
    check_thread_archived : function(thread){return false;}, // check the thread is archived.
    get_owners_recommendation: function(){return '';}, // return string of owner's recommendation.
    get_board_tags : function(){return {};}, // return object of board tags.
//    get_json_url_thread : function(board,thread){return '';}, // return url of JSON API.
    get_json_url_catalog : function(board){return '';}, // return url of JSON API.
    parse_json_thread: function(txt){return JSON.parse(txt);}, // parser of JSON API.
    parse_json_catalog: function(txt){return JSON.parse(txt);},  // parser of JSON API.
    uip_tgt_post : function(no){return null;}, // returns uip target post.
    uip_post_num : function(post){return null;} // returns num in posts.
  };
  site2['common'] = { // common functions
    remove_by_classname : function(pn,classname,end){
      if (end===undefined) end = 0;
      var tgts = pn.getElementsByClassName(classname);
//      for (var i=tgts.length-1;i>=0;i--) tgts[i].outerText = '';
      for (var i=tgts.length-1-end;i>=0;i--) tgts[i].parentNode.removeChild(tgts[i]);
    },
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
        if (last_node.tagName != 'HR' && last_node.tagName != 'BR') break;
        else th.removeChild(last_node);
      }
    },
    remove_brs : function(elem){
      var tgts = elem.getElementsByTagName('br');
      for (var i=tgts.length-1;i>=0;i--) tgts[i].parentNode.removeChild(tgts[i]);
    },
    remove_double_br : function(elem){
      var elems = elem.getElementsByTagName('*');
      for (var i=elems.length-2;i>=0;i--) {
        if (elems[i].outerHTML=='<br>' && elems[i+1].outerHTML=='<br>') elems[i+1].parentNode.removeChild(elems[i+1]);
      }
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
    thread2headline : function(doc,nickname){
      var retval  = site2[nickname].insert_footer(doc,0,'t2h',false,0,0,0);
      site2[nickname].remove_posts(doc,pref.catalog_t2h_num_of_posts);
      site2.common.remove_double_br(doc);
      var retval2 = site2[nickname].insert_footer(doc,0,'t2h',false,0,0,0);
      return [retval[0]-retval2[0], retval[1]-retval2[1]];
    },
    mark_newer_posts : function(nickname,posts,date,style_mark,style_unmark,class_or_tag,key){
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
//            offset_top = reply.offsetTop;
            marked_first_post = reply;
          } else reply.setAttribute('style',style_unmark);
      }
//      return offset_top;
      return marked_first_post;
    },
  };
  site2['8chan'] = {
    nickname : '8chan',
    home : site.protocol + '//8chan.co',
    features : {page: true, graph: true, setting: true, postform: false, catalog: true, listener : true, uip_tracker: true, debug: false},
    check_func : function(){
      if (window.location.href.search(/8chan.co/)!=-1) { // 8chan
        site.config('8chan.co','8chan');
        var header = document.getElementsByClassName('boardlist')[0];
        if (header) site.header_height = header.offsetHeight;
        site.postform = document.getElementsByTagName('form')[0];
        site.postform_comment = document.getElementById('body');
        if (site.features.post && site.postform) site.postform_submit = site.postform.childNodes[5].childNodes[0].childNodes[2].childNodes[1].childNodes[1];
        site.max_page = site2['8chan'].max_page(site.board);
        pref.catalog.on_bt_page = window.location.href.search('8chan.co/boards.html')!=-1;
        return true;
      } else return false;
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
      return [Date.parse(posts[posts.length-1].getElementsByTagName('time')[0].getAttribute('datetime')) - pref.localtime_offset*3600000,
              Date.parse(posts[0             ].getElementsByTagName('time')[0].getAttribute('datetime')) - pref.localtime_offset*3600000];
    },
    get_thread_link : function(pn,bn,del,name){
      var as = pn.getElementsByClassName('post op')[0].getElementsByTagName('a');
      var href = null;
      for (var i=as.length-1;i>=0;i--) if (as[i].innerHTML=='[Reply]' || as[i].innerHTML=='[Last 50 Posts]') {
        if (as[i].innerHTML=='[Reply]') href = as[i].getAttribute('href');
        if (del) as[i].parentNode.removeChild(as[i]);
        else {
//          as[i].setAttribute('target',(pref.catalog_open_in_new_tab)? '_blank' : '_self');
//          as[i].setAttribute('onclick','open_new_thread('+as[i].getAttribute('href')+','+name+')');
          as[i].addEventListener('click', function(){open_new_thread(as[i].getAttribute('href'),name);}, false);
//          as[i].removeAttribute('href');
        }
      }
      return href;
    },
    modify_thread_link : function(pn){
      var retval = [];
      var as = pn.getElementsByClassName('post op')[0].getElementsByTagName('a');
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
    add_thread_link : function(doc,url){
      var pn = document.createElement('a');
      pn.href = url.replace(/https*:\/\/8chan.co/,'');
      pn.innerHTML = '[Reply]';
      var th = doc.getElementsByClassName('post op')[0];
      if (th) th.insertBefore(pn,th.firstChild);
    },
    catalog_threads_in_page : function(doc){
      var pc = doc.getElementsByName('postcontrols');
      th = [];
      if (pc.length!=0)
        for (var i=0;i<pc[0].childNodes.length;i++)
          if (pc[0].childNodes[i].id && pc[0].childNodes[i].id.substr(0,6)=='thread') th.push(pc[0].childNodes[i]);
      return th;
    },
    remove_posts : function(th,end){
      site2.common.remove_by_classname(th,'post reply',end);
      site2.common.remove_double_br(th);
//      var posts = doc.getElementsByClassName('post reply',end);
//      for (var i=posts.length-1;i>=0;i--) posts[i].outerText = '';
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
    make_url : function(board,no){return site.protocol + '//8chan.co' + board + ((no!=0)? (no+1) :'index')+'.html';},
    make_url3: function(board,th){return site.protocol + '//8chan.co' + board + 'res/' + th + '.html';},
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
    absolute_link : function(doc){
      var all = doc.getElementsByTagName('*');
      for (var i=0;i<all.length;i++) {
//        if (all[i].getAttribute('src') && all[i].getAttribute('src').indexOf('http')!=0)  all[i].setAttribute('src','https://media.8chan.co'+all[i].getAttribute('src'));
//        if (all[i].getAttribute('href')&& all[i].getAttribute('href').indexOf('http')!=0) all[i].setAttribute('href','https://media.8chan.co'+all[i].getAttribute('href'));
//        if (all[i].getAttribute('src')  && all[i].getAttribute('src').indexOf('http')!=0  && all[i].getAttribute('src').substr(0,2)!='//')  all[i].setAttribute('src','https://media.8chan.co'+all[i].getAttribute('src'));
//        if (all[i].getAttribute('href') && all[i].getAttribute('href').indexOf('http')!=0 && all[i].getAttribute('href').substr(0,2)!='//') all[i].setAttribute('href','https://media.8chan.co'+all[i].getAttribute('href'));
        if (all[i].getAttribute('src')  && all[i].getAttribute('src').indexOf('http')!=0  && all[i].getAttribute('src').substr(0,2)!='//')  all[i].setAttribute('src',site.protocol + '//8chan.co'+all[i].getAttribute('src'));
        if (all[i].getAttribute('href') && all[i].getAttribute('href').indexOf('http')!=0 && all[i].getAttribute('href').substr(0,2)!='//') all[i].setAttribute('href',site.protocol + '//8chan.co'+all[i].getAttribute('href'));
      }
    },
    insert_footer : function(th,page_no,bn,exe,date,nof_posts,nof_files){
      var key = (!brwsr.ff)? 'innerText' : 'innerHTML';
      nof_posts += th.getElementsByClassName('post').length;
      nof_files += th.getElementsByClassName('fileinfo').length;
      var om_info = th.getElementsByClassName('omitted');
      if (om_info[0]) {
        var str = om_info[0][key].replace(/\n/g,'');
        nof_posts += parseInt(str.replace(/\ post.*/,''),10);
        nof_files += parseInt('0'+str.replace(/\ image.*/,'').replace(/[^\ ]*\ /g,''),10);
      }
      if (exe) {
        var pn = document.createElement('div');
        pn.setAttribute('name','catalog_footer');
        if (pref.catalog_footer_br) pn.setAttribute('style','clear:both');
        pn.innerHTML = '<span>' + bn + '  ' + nof_posts + '/' + nof_files + '/' + page_no + '  </span>';
        var flags = th.getElementsByClassName('flag');
        for (var i=0;i<flags.length;i++) {
          pn.appendChild(flags[i].cloneNode(false));
//          pn.appendChild(document.createTextNode(' '));
        }
        th.insertBefore(pn,th.getElementsByClassName('post op')[0]);
      }
      return [nof_posts,nof_files];
    },
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
    format_thread_always : function(th){
      site2.common.remove_last_hrs_and_brs(th);
//      site2.common.remove_by_tagname(th,'hr');
//      site2.common.remove_last_brs(th);
    },
    format_time : function(th){
      var times = th.getElementsByTagName('time');
      for (var i=0;i<times.length;i++) times[i][brwsr.innerText] = site2.common.change_utc_to_local(times[i].getAttribute('datetime'));
    },
    mark_newer_posts : function(th,date){
      var marked_first_post = null;
//      var offset_top = 0;
      var times = th.getElementsByTagName('time');
      for (var i=times.length-1;i>=0;i--) {
        var mark = date<Date.parse(times[i].getAttribute('datetime'))-pref.localtime_offset*3600000;
        var reply = times[i].parentNode;
        while (reply.className.search(/post/)==-1) reply = reply.parentNode;
        if (mark) {
          reply.setAttribute('style','border: 2px solid red');
          marked_first_post = reply;
//          offset_top = reply.offsetTop;
        } else reply.setAttribute('style','border: none');
      }
//      return offset_top;
      return marked_first_post;
    },
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
    thread2headline : function(doc){
      return site2.common.thread2headline(doc,'8chan');
    },
//    get_json_url_thread: function(board,thread){
//      return site.protocol + '//8chan.co' + board +'res/' + thread + '.json';
//    },
    get_json_url_catalog: function(board){
      return site.protocol + '//8chan.co' + board +'catalog.json';
    },
    parse_json_thread: function(txt){
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
    }
  };
  site2['KC'] = {
    nickname : 'KC',
    features : {page: true, graph: true, setting: true, postform: true, catalog: true, listener : true, uip_tracker: false, debug: false},
    check_func : function(){
      if (!site2['KC'].force_https) site2['KC'].protocol = site.protocol;
      if (window.location.href.search(/krautchan.net/)!=-1) { // Krautchan
        site.config('krautchan.net','KC');
        site.max_page  = (site2['KC'].max_page_kc[site.board]==undefined)? 10 : site2['KC'].max_page_kc[site.board];
        return true;
      } else return false;
    },
    force_https : false,
    protocol : 'https:',
    home : site.protocol + '//krautchan.net',
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
    make_url : function(board,no){return site2['KC'].protocol + '//krautchan.net' + board + ((no==0)? '' : no + '.html');},
    make_url3: function(board,th){return site2['KC'].protocol + '//krautchan.net' + board + 'thread-' + th + '.html';},
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
    add_thread_link : function(doc,url){
      var pn = document.createElement('a');
      pn.href = url.replace(/https*:\/\/krautchan\.net/,'');
      pn.innerHTML = 'Reply';
      var th = doc.getElementsByClassName('postheader')[0];
      if (th) {
        th.insertBefore(pn,th.firstChild);
        th.insertBefore(document.createTextNode('['),pn);
        th.insertBefore(document.createTextNode(']'),pn.nextSibling);
      }
    },
    time_offset : 1,
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
    mark_newer_posts: function(th,date) {
      var pn = site2.common.mark_newer_posts('KC',th.getElementsByTagName('table'),date,'border:2px solid red','border: none','class','postreply');
      return (pn!=null)? pn.offsetParent : null;
    },
    format_time : function(th){
      var times = th.getElementsByClassName('postdate');
      for (var i=0;i<times.length;i++) times[i][brwsr.innerText] = site2.common.change_utc_to_local(brwsr.Date_parse(times[i][brwsr.innerText])+(pref.localtime_offset-site2['KC'].time_offset)*3600000);
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
    insert_footer : function(th,page_no,bn,exe,date,nof_posts,nof_files){
      var key = (!brwsr.ff)? 'innerText' : 'innerHTML';
      var posts = th.getElementsByTagName('table');
      nof_posts += posts.length +1; // +1 for OP.
      var files = th.getElementsByClassName('file_thread');
      nof_files += th.getElementsByClassName('filename').length;
      var om_info = th.getElementsByClassName('omittedinfo');
      if (om_info[0]) {
        var str = om_info[0][key].replace(/\n/g,'');
        nof_posts += parseInt(str.replace(/\ post.*/,''),10);
        nof_files += parseInt('0'+str.replace(/\ file.*/,'').replace(/[^\ ]*\ /g,''),10);
      }
      if (exe) {
        var pn = document.createElement('div');
//        pn.name = 'catalog_footer';
        pn.setAttribute('name','catalog_footer');
//        pn[key] = bn + '  ' + nof_posts + '/' + nof_files + '/' + page_no + '  ';
        pn.innerHTML = '<span>' + bn + '  ' + nof_posts + '/' + nof_files + '/' + page_no + '  </span>';
        var imgs = th.getElementsByTagName('img');
        for (var i=0;i<imgs.length;i++) {
//          if (imgs[i].src && imgs[i].getAttribute('src').search(/images\/balls/)!=-1) pn.appendChild(imgs[i].cloneNode(false)); // doesn't work in KC.
          if (imgs[i].getAttribute('src') && imgs[i].getAttribute('src').search(/images\/balls/)!=-1) pn.appendChild(imgs[i].cloneNode(false));
        }
        th.insertBefore(pn,files[0]);
      }
      return [nof_posts,nof_files];
    },
    remove_posts : function(th,end){
//      site2.common.remove_by_tagname(th,'table',end);
//      site2.common.remove_double_tags(th,'A');
      var tgts = th.getElementsByTagName('table');
      for (var i=tgts.length-1-end;i>=0;i--) {
        if (tgts[i].previousSibling.previousSibling) tgts[i].parentNode.removeChild(tgts[i].previousSibling.previousSibling); // a tags
        tgts[i].parentNode.removeChild(tgts[i].previousSibling); // text
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
      site2.common.remove_by_tagname(doc,'script');
      site2.common.remove_attribute(doc,'onload');
      site2.common.remove_attribute(doc,'onmouseover');
      site2.common.remove_attribute(doc,'onmouseout');
      site2.common.remove_attribute(doc,'onclick');
    },
    thread2headline : function(doc){
      return site2.common.thread2headline(doc,'KC');
    }
  };
  site2['4chan'] = {
    nickname : '4chan',
    features : {page: true, graph: true, setting: true, postform: false, catalog: true, listener : true, uip_tracker: true, debug: false},
    check_func : function(){
      if (window.location.href.search(/4chan.org/)!=-1) { // 4chan
        site.config('4chan.org','4chan');
        site.max_page = site2['4chan'].max_page(site.board);
        var header = document.getElementById('board-list');
        if (header) site.header_height = header.offsetHeight;
        return true;
      } else return false;
    },
//    catalog_background : '#ffffee',
//    catalog_bordercolor : '#f0e0d6',
    catalog_threads_in_page : function(doc){return doc.getElementsByClassName('thread');},
    catalog_posts_in_thread : function(doc){return doc.getElementsByClassName('replyContainer');},
    max_page : function(){return 10;},
    make_url : function(board,no){return site.protocol+'//boards.4chan.org' + board + ((no!=0)? (no+1) :'');},
    make_url3: function(board,th){return site.protocol+'//boards.4chan.org' + board + 'thread/' + th;},
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
    add_thread_link : function(doc,url){
//      <a href="thread/32599218/finland-general" class="replylink" rel="canonical">Reply</a>
      var pn = document.createElement('a');
      var prefix = new RegExp('https*://boards\.4chan\.org/[^/]*/');
      pn.href = url.replace(prefix,'');
      pn.className = 'replylink';
      pn.rel = 'canonical';
      pn.innerHTML = 'Reply';
      var th = doc.getElementsByClassName('thread')[0];
      if (th) {
        th.insertBefore(pn,th.firstChild);
        th.insertBefore(document.createTextNode('['),pn);
        th.insertBefore(document.createTextNode(']'),pn.nextSibling);
      }
    },
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
      return (parseInt(post.getElementsByClassName('dateTime')[0].getAttribute('data-utc'),10)- pref.localtime_offset*3600)*1000;
    },
    mark_newer_posts: function(th,date) {
      return site2.common.mark_newer_posts('4chan',th.getElementsByClassName('postContainer'),date,'border:2px solid red','border: none','class','post reply');
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
      site2.common.remove_by_classname(th,'postContainer replyContainer',end);
      site2.common.remove_double_br(th);
    },
    absolute_link : function(doc,board){
      var url_prefix = 'http://boards.4chan.org';
      var protocol   = 'http:';
      var all = doc.getElementsByTagName('*');
      for (var i=0;i<all.length;i++) {
        if (all[i].getAttribute('src')) 
          if (all[i].getAttribute('src').substr(0,2)!='//') all[i].setAttribute('src', url_prefix+board+all[i].getAttribute('src'));
          else all[i].setAttribute('src', protocol+all[i].getAttribute('src'));
        if (all[i].getAttribute('href'))
          if (all[i].getAttribute('href').substr(0,2)!='//') all[i].setAttribute('href',url_prefix+board+all[i].getAttribute('href'));
          else all[i].setAttribute('href',protocol+all[i].getAttribute('href'));
      }
    },
    insert_footer : function(th,page_no,bn,exe,date,nof_posts,nof_files){
      var key = (!brwsr.ff)? 'innerText' : 'innerHTML';
      nof_posts += th.getElementsByClassName('postContainer').length;
      nof_files += th.getElementsByClassName('fileText').length;
      var om_info = th.getElementsByClassName('summary desktop');
      if (om_info[0]) {
        var str = om_info[0][key].replace(/\n/g,'');
        nof_posts += parseInt(str.replace(/\ post.*/,''),10);
        nof_files += parseInt('0'+str.replace(/\ image.*/,'').replace(/[^\ ]*\ /g,''),10);
      }
      if (exe) {
        var pn = document.createElement('div');
        pn.setAttribute('name','catalog_footer');
        pn.innerHTML = '<span>' + bn + '  ' + nof_posts + '/' + nof_files + '/' + page_no + '  </span>';
        var flags = th.getElementsByClassName('flag');
        for (var i=0;i<flags.length;i+=2) { // contains both mobile and desktop.
          pn.appendChild(flags[i].cloneNode(false));
//          pn.appendChild(document.createTextNode(' '));
        }
        var op_info = th.getElementsByClassName('postInfo desktop')[0];
        op_info.parentNode.insertBefore(pn,op_info);
      }
      return [nof_posts,nof_files];
    },
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
    thread2headline : function(doc){
      return site2.common.thread2headline(doc,'4chan');
    },
//    get_json_url_thread: function(board,thread){
//      return site.protocol + '//a.4cdn.org' + board +'thread/' + thread + '.json';
//    },
    get_json_url_catalog: function(board){
      return site.protocol + '//a.4cdn.org' + board +'catalog.json';
    },
    uip_check: function(callback){
      var url = site.protocol + '//a.4cdn.org' + site.board +'thread/' + site.thread + '.json';
      var key = site.nickname + site.board + site.thread;
      http_req.get('uip',key,url,callback,false,false);
    },
    parse_json_thread: function(txt){
      var obj = JSON.parse(txt);
      obj.posts[obj.posts.length-1]['unique_ips'] = obj.posts[0]['unique_ips'];
      return obj;
    },
    uip_tgt_post : function(no){
      return document.getElementById('pc'+no);
    },
    uip_post_num : function(tgt_post){
      return tgt_post.getElementsByClassName('postNum');
    }
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
    make_url : function(board,no){return 'http://'+site.server_name+'.2chan.net' + board + ((no==0)? 'futaba' : no) + '.htm';},
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
    format_thread : function(doc){return doc;}
  };

  for (var i in site2) {
    if (i=='DEFAULT') continue;
    for (var j in site2['DEFAULT'])
      if (site2[i][j]===undefined) site2[i][j]=site2['DEFAULT'][j];
  }

  if (  localStorage &&   localStorage[pref.script_prefix+'.pref']) pref_func.pref_overwrite(pref,JSON.parse(  localStorage[pref.script_prefix+'.pref']));
  if (sessionStorage && sessionStorage.pref) pref_func.pref_overwrite(pref,JSON.parse(sessionStorage.pref));
  pref_func.site2_json();

//  if (window.location.href.search(/krautchan.net/)!=-1) { // Krautchan
//    site.config('krautchan.net','KC');
//    site.max_page  = (site2['KC'].max_page_kc[site.board]==undefined)? 10 : site2['KC'].max_page_kc[site.board];
//    if (!site2['KC'].force_https && site.protocol=='http:') site2['KC'].protocol = site.protocol;
//  } else if (window.location.href.search(/4chan.org/)!=-1) { // 4chan
//    site.config('4chan.org','4chan');
//    site.max_page = site2['4chan'].max_page(site.board);
//  } else if (window.location.href.search(/2chan.net/)!=-1) { // futaba
//    site.config('2chan.net','futaba');
//    site.max_page = site2['futaba'].max_page_futaba[site.server_name + site.board];
//  } else if (window.location.href.search(/8chan.co/)!=-1) { // 8chan
//    site.config('8chan.co','8chan');
//    var header = document.getElementsByClassName('boardlist')[0];
//    if (header) site.header_height = header.offsetHeight;
//    site.postform = document.getElementsByTagName('form')[0];
//    site.postform_comment = document.getElementById('body');
//    if (site.features.post && site.postform) site.postform_submit = site.postform.childNodes[5].childNodes[0].childNodes[2].childNodes[1].childNodes[1];
//    site.max_page = site2['8chan'].max_page(site.board);
//  }
  for (var i in site2) if (i!=='DEFAULT' && i!=='common') site2[i].check_func();

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
    ports[name] = 'init';
    init_func[name] = function(e){initialize(e,name);};
    window.addEventListener('message', init_func[name], false);
    if (pref.debug_mode) console.log(window.name + ': Waiting for connection from '+name+' ...');
    function initialize(e,name) {
      if (pref.debug_mode) console.log(window.name + ': Connecting from '+e.data);
      if (e.source==win) {
        if (pref.debug_mode) console.log(window.name + ': Connected successfully.');
        if (!brwsr.ff) init_receive_port(name,e.ports[0]);
        else init_receive_port(name,win);
        window.removeEventListener('message', init_func[name], false);
        delete init_func[name];
        send_message(name,messages_to_send[name]);
        delete messages_to_send[name];
        if (name=='_blank') send_message(name,[['CLOSE']]);
      } else if (pref.debug_mode) console.log(window.name + ': FAIL.');
    }
  }
  function make_port_child(parent){
    if (pref.debug_mode) console.log(window.name + ': Try to connect to parent...');
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
    if (!ports[name]) make_port_parent(name,win);
    if (ports[name]==='init') { // chrome works at ==.
      if (!messages_to_send[name]) messages_to_send[name] = [];
      for (var i=0;i<val.length;i++) messages_to_send[name].push(val[i]);
    } else {
      for (var i=0;i<val.length;i++) {
        if (pref.debug_mode) console.log(window.name + ': Sent to '+name+': '+val[i].toString().substr(0,80));
        if (!brwsr.ff) ports[name].postMessage(JSON.stringify(val[i]));
        else ports[name].postMessage(JSON.stringify(val[i]),'*');
        if (val[i][0]=='CLOSE') close_connection(name);
      }
    }
  }
  function receive_message(e,name) {
    if (pref.debug_mode) console.log(window.name + ': Received from '+name+': '+e.data.toString().substr(0,80));
    var val = JSON.parse(e.data);
    if (typeof(val)=='string') val=JSON.parse(val); // patch for GM.
    if (val[0]=='CLOSE') close_connection(name);
    else if (val[0]=='MARK' && val[1]>=0) {
      var marked_first_post = site2[site.nickname].mark_newer_posts(document,val[1]);
      if (marked_first_post) scrollTo(0,marked_first_post.offsetTop);
    } else if (val[0]=='SUBFRAME_INIT') http_req.remote();
    else if (val[0]=='SUB_GET') http_req.sub_get(val[1]);
    else if (val[0]=='SUB_ACK') http_req.sub_ack(val[1]);
  }
//  function receive_message(e,name) { // working code for old http_req
//    if (pref.debug_mode) console.log(window.name + ': Received from '+name+': '+e.data.toString().substr(0,80));
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
    make_port_child(window.opener);
    var hit = false;
    var nicknames = ['8chan','KC','4chan','futaba'];
    for (var i in nicknames) if (nicknames[i]===window.name) {hit=true;break;}
    if (hit) for (var i in site.features) site.features[i] = false;
  }


//  var ports = {}; // working code for test
//  function make_port_parent(name, val){
//    ports[name] = val;
//    var port;
//    if (pref.debug_mode) console.log('parent: '+name+', '+val);
//    window.onmessage = function(e) {
//      if (pref.debug_mode) console.log('from child #unkown: '+e.data);
//      port = e.ports[0];
//      port.postMessage(JSON.stringify(['MARK',val]));
//      port.postMessage(JSON.stringify('CLOSE'));
//      port.close();
////      port.onmessage = function(e) {
////        if (pref.debug_mode) console.log(e.data);
////        port.postMessage('received : ('+Date.now()+')');
////      }
//    }
//  }
//
//  function make_port_child(prt){
//    if (pref.debug_mode) console.log('child :');
//    var channel = new MessageChannel;
//    var port = channel.port1;
//    prt.postMessage('Connection: ', [channel.port2], '*');
////    prt.postMessage('start', [channel.port2], '*');
////    setInterval(function() {port.postMessage('sent : ' + (+new Date));}, 2000);
////    port.onmessage = function(e) {if (pref.debug_mode) console.log(e.data);};
//    port.onmessage = function(e) {
//      if (pref.debug_mode) console.log(e.data);
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
    function make_httpd(sender){
      var httpd = new XMLHttpRequest();
      function httpd_events(){
        if (local) onload_local(sender,Date.now(),httpd.status,httpd.responseText,false);
        else send_message('parent',[['SUB_ACK',[sender,Date.now(),httpd.status,httpd.responseText]]]);
      }
      httpd.addEventListener('load',  httpd_events, false);
      httpd.addEventListener('error', httpd_events, false);
      httpd.addEventListener('abort', httpd_events, false);
      httpds[sender] = httpd;
    }
    function make_iframe(domain,url){
      var ifrm = cnst.init('left:200px:bottom:200px:display:none:Show');
//      var ifrm = cnst.init('left:200px:bottom:200px:Show');
      ifrm.innerHTML = '<iframe name=' + domain + '></iframe>';
      iframes[domain] = window.open((site2[domain].home!=='')? site2[domain].home : url, domain);
      send_message(domain,[['SUBFRAME_INIT']],iframes[domain]);
    }
    function onload_from_sw_cache(key,value) {
//      var val = (value!=null)? JSON.parse(value) : [0,1000,null];
      var val = (value!==null)? JSON.parse(value) : [0,null];
      for (var i in req)
       if (req[i].sw_cache && key==req[i].key)
//         onload_local(req[i].sender,val[0],val[1],val[2],true);
         onload_local(i,val[0],200,val[1],true);
    }
    function onload_local(sender,date,status,response_txt,from_cache) {
      var callback = req[sender].callback;
      var key = req[sender].key;
      var cache_write = req[sender].sw_cache_write;
//      delete req[sender]; // patch
      if (!from_cache && cache_write) {
//        caches[key] = [date, status, response_txt];
//        setTimeout(function(){delete caches[key];},10000);
        if (pref.info_server && brwsr.sw_cache) brwsr.sw_cache.setItem(key,JSON.stringify([date, response_txt]));
//        if (pref.info_server && brwsr.sw_cache) brwsr.sw_cache.setItem(key,JSON.stringify([date, status, response_txt]));
      }
      callback(date, status, response_txt);
    }
    function get_req(sender,domain,url,key,sw_cache){
//      if (caches[key]) setTimeout(function(){onload_local(sender,caches[key][0],caches[key][1],caches[key][2],true);},0); // this make racing condition at checking page in catalog.
      if (sw_cache && brwsr.sw_cache) brwsr.sw_cache.trygetItem(key,onload_from_sw_cache);
      else {
        if (domain==site.nickname || pref.catalog_cross_domain_connection=='direct') {
          if (httpds[sender]==undefined) make_httpd(sender);
          httpds[sender].open('GET', url, true);
          httpds[sender].send(null);
        } else {
          if (!iframes[domain]) make_iframe(domain,url);
          send_message(domain,[['SUB_GET',[sender,domain,url,key,sw_cache]]]);
        }
      }
    }
    return {
      get: function (sender,key,url,callback,sw_cache,sw_cache_write){
        var dbt = cnst.name2domainboardthread(key,true);
        key = dbt[0]+dbt[1]+dbt[2];
        req[sender] = {url:url, callback:callback, key:key, sw_cache:sw_cache, sw_cache_write:sw_cache_write};
        if (url==='')
          if (dbt[2].indexOf('p')==0) url = site2[dbt[0]].make_url(dbt[1],parseInt(dbt[2].substr(1),10));
          else url = site2[dbt[0]].make_url3(dbt[1],dbt[2]);
        get_req(sender,dbt[0],url,key,sw_cache);
      },
      sub_get: function(arg){get_req(arg[0],arg[1],arg[2],arg[3],arg[4]);},
      sub_ack: function(arg){onload_local(arg[0],arg[1],arg[2],arg[3],false);},
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
    function maximize(pn,tb,state,callback_func){
      if (state[0]==false) {
        var retval = [true, pn.style.left, pn.style.top, pn.childNodes[1].style.width, pn.childNodes[1].style.height];
        pn.style.left   = '0px';
        pn.style.top    = site.header_height + 'px';
//        pn.childNodes[1].style.width  = window.innerWidth  + 'px';
//        pn.childNodes[1].style.height = window.innerHeight - tb.offsetHeight + 'px';
        pn.childNodes[1].style.width  = document.documentElement.clientWidth  + 'px';
        pn.childNodes[1].style.height = document.documentElement.clientHeight - tb.offsetHeight - site.header_height + 'px';
        callback_func();
        return retval;
      } else {
        pn.style.left   = state[1];
        pn.style.top    = state[2];
        pn.childNodes[1].style.width  = state[3];
        pn.childNodes[1].style.height = state[4];
        callback_func();
        return [false];
      }
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
      bottom : 0
    };
    return {
      init: function(func_str,rolldown_func,rollup_func,exit_func,maximize_func){
        var pn = document.createElement('div');
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
              '<div style="float: left"><button type="button">-</button><button type="button"><</button><button type="button">></button></div>' +
              '<div style="float: right"><button type="button">[]</button><button type="button">X</button></div>' +
              '<div></div>' +
              '</div>' +
              '<div style="background: #e5ecf9; margin: 0px 3px 3px 3px"></div>';
//            pn.innerHTML = '<div><div style="float: left"><button type="button">-</button><button type="button"><</button><button type="button">></button></div><div style="float: right"><button type="button">X</button></div><div></div></div><div style="background: #e5ecf9; margin: 0px 3px 3px 3px"></div>'
            var tb = pn.childNodes[0];
            tb.childNodes[2].style.height = tb.childNodes[0].offsetHeight + 'px';
            rollup_func_tb = function(){rollup(pn,pn.childNodes[1],rollup_func,rolldown_func);};
            tb.childNodes[0].childNodes[0].onclick = rollup_func_tb;
            tb.childNodes[0].childNodes[1].onclick = function(){opacity(pn, false);};
            tb.childNodes[0].childNodes[2].onclick = function(){opacity(pn, true);};
            tb.childNodes[2].ondblclick = rollup_func_tb;
            var maximize_state = [false];
            tb.childNodes[1].childNodes[0].onclick = function(){maximize_state = maximize(pn,tb,maximize_state,maximize_func);};
            tb.childNodes[1].childNodes[1].onclick = exit_func;
            if (brwsr.ff) {
              pn.draggable = false;
              tb.childNodes[2].draggable = true;
            }
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
          } else if (arg=='Show') document.getElementsByTagName('body')[0].appendChild(pn);
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
        return (rollup_func_tb)? [pn,rollup_func_tb] : pn;
      },
      bottom_top: function(pn){
        pn.style.top = (window.innerHeight - parseInt(pn.style.bottom.replace(/px/,''),10) - pn.offsetHeight) + 'px';
        pn.style.bottom = '';
      },
      void_func: function(){},
      drag_sx : function(){return drag_sx;},
      drag_sy : function(){return drag_sy;},
      div_destroy: function(pn,child_of_body){
        if (pref.show_tooltip) pref_func.tooltips.remove_hier(pn);
        if (child_of_body) document.getElementsByTagName('body')[0].removeChild(pn);
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
      name2domainboardthread: function(name,fill){
        var thread = name.replace(/[^\/]*\//g,'');
        var domain = name.replace(/\/.*/,'');
        var board  = name.replace(domain,'').replace(thread,'');
        if (thread==domain)
          if (thread.search(/[^0-9]/)!=-1) thread ='';
          else domain = '';
        if (fill) {
          if (domain==='') domain = site.nickname;
          if (board==='') board = site.board;
        }
        return [domain,board,thread];
      },
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

  var timer_obj;
  var chart_obj;
  var setting_obj;
  var post_form_obj;
  var wafd = null;
  var catalog_obj;
  var cnst_obj = (function(){
    if (site.features.catalog) {
      var pn12 = cnst.init('left:0px:bottom:0px:button:catalog(beta):Show:tile:set:left');
      catalog_obj = make_catalog_obj(pn12);
    }
    if (site.features.setting) {
      var pn13 = cnst.init('tile:get:left:tile:get:bottom:button:settings:Show:tile:set:left');
      pref_func.settings.show_hide = function(){cnst.make_destroy(pref_func.settings,'pn13',pref_func.settings.prep_pn13,pref_func.settings.destroy_pn13);};
      pn13.addEventListener('click', pref_func.settings.show_hide, false);
    }
    if (site.features.graph) {
      var pn1 = cnst.init('tile:get:left:tile:get:bottom:button:Graph:Show:tile:set:left');
      chart_obj = make_chart_obj(pn1);
    }
    if (site.features.setting) {
      var pn8 = cnst.init('tile:get:left:tile:get:bottom:button:settings2:Show:tile:set:left');
      setting_obj = make_setting_obj(pn8);
    }
    if (site.features.postform && site.postform!=null) {
      wafd = make_wafd();
      var pn9 = cnst.init('tile:get:left:tile:get:bottom:button:post_form:Show:tile:set:left');
      post_form_obj = make_post_form_obj(pn9);
    }
    if (site.features.debug) {
      var pn_debug_button = cnst.init('tile:get:left:tile:get:bottom:button:debug:Show:tile:set:left');
      make_debug_obj(pn_debug_button);
//  var pn_debug_out    = cnst.init('left:200px:bottom:50px:txt:debug_out');
    }
    if (site.features.page) {
      var pn0 = cnst.init('tile:get:left:tile:get:bottom:txt:init:Show:tile:set:bottom');
      timer_obj  = make_timer_obj(pn0);
    }
//    if (site.features.page) {
//      var pn0 = cnst.init('left:0px:bottom:0px:txt:init:fontSize:24px:Show:tile:set:bottom');
//      timer_obj  = make_timer_obj(pn0);
//    }
//    if (site.features.graph) {
//      var pn1 = cnst.init('left:0px:tile:get:bottom:button:Graph:Show:tile:set:left');
//      chart_obj = make_chart_obj(pn1);
//    }
//    if (site.features.setting) {
//      var pn8 = cnst.init('tile:get:left:tile:get:bottom:button:settings:Show:tile:set:left');
//      setting_obj = make_setting_obj(pn8);
//    }
//    if (site.features.setting) {
//      var pn13 = cnst.init('tile:get:left:tile:get:bottom:button:settings2:Show:tile:set:left');
//      pref_func.settings.show_hide = function(){cnst.make_destroy(pref_func.settings,'pn13',pref_func.settings.prep_pn13,pref_func.settings.destroy_pn13);};
//      pn13.addEventListener('click', pref_func.settings.show_hide, false);
//    }
//    if (site.features.postform && site.postform!=null) {
//      wafd = make_wafd();
//      var pn9 = cnst.init('tile:get:left:tile:get:bottom:button:post_form:Show:tile:set:left');
//      post_form_obj = make_post_form_obj(pn9);
//    }
//    if (site.features.catalog) {
////      var pn12 = cnst.init('tile:get:left:tile:get:bottom:button:catalog(beta):Show:tile:set:left');
//      var pn12 = cnst.init('tile:get:left:tile:get:bottom:button:catalog(beta):Show:tile:set:bottom');
//      catalog_obj = make_catalog_obj(pn12);
//    }
//    if (site.features.debug) {
//      var pn_debug_button = cnst.init('tile:get:left:tile:get:bottom:button:debug:Show:tile:set:bottom');
//      make_debug_obj(pn_debug_button);
////  var pn_debug_out    = cnst.init('left:200px:bottom:50px:txt:debug_out');
//    }
  })();

  function make_uip_tracker (){
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
    uip_check();
//    function uip_check(){http_req.get('uip',key,url,uip_show,false,false);}
    function uip_check(){site2[site.nickname].uip_check(uip_show);}

    var threads = {};
    var threads_req = {};
    var threads_req_mutex = true;
    var threads_opened = {};
    function uip_auto_open(date,status,response_txt){
//      var obj = JSON.parse(response_txt);
      var obj = site2[site.nickname].parse_json_catalog(response_txt);
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
    function uip_auto_open_check(){
      var kwd = pref.uip_tracker.auto_open_kwd;
      if (kwd==='') kwd = '.*';
      for (var i in threads_req) {
        if (threads[i] && i>site.thread && threads_opened[i]===undefined) {
          var flag = false;
          flag |= threads[i].sub  && threads[i].sub.search(kwd) !=-1;
          flag |= threads[i].name && threads[i].name.search(kwd)!=-1;
          flag |= threads[i].com  && threads[i].com.search(kwd) !=-1;
          console.log('auto_opener: '+i+': '+flag);
//          if (flag) window.open(site2[site.nickname].make_url3(site.board,i), site.domain+site.board+i);
          if (flag) {
            window.open(site2[site.nickname].make_url3(site.board,i), '_blank');
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
    function uip_show(date,status,response_txt){
//      var obj = JSON.parse(response_txt);
      var obj = site2[site.nickname].parse_json_thread(response_txt);
      var posts = obj.posts.length;
      var uips = obj.posts[posts-1]['unique_ips'];
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
//              if (flag) console.log('auto_opener: '+tgt);
              threads_req[tgt] = tgt;
            }
          }
          uip_auto_open_check();
        }
      }
      if (last_updated[0]!=no || last_updated[1]!=posts || last_updated[2]!=uips) {
//        last_updated = [no,posts,uips,last_updated[1]+1!=posts,last_updated[2]!=uips];
//        console.log(new Date(date).toLocaleTimeString()+', '+no+', '+posts+', '+uips);
        var post_hilight = (obj.posts.length<last_updated[1] || obj.posts[last_updated[1]-1]['no']!=last_updated[0]);
        var posts_deleted = '';
        if (pref.uip_tracker.deletion) {
          var posts_no_new = {};
          for (var i=0;i<obj.posts.length;i++) posts_no_new[obj.posts[i].no] = 1; // dummy;
          for (var i in posts_no) if (posts_no_new[i]===undefined) posts_deleted = posts_deleted + ((posts_deleted!=='')? ',' : '') + i;
          posts_no = posts_no_new;
if (posts_deleted!=='') console.log('uip_deleted '+posts_deleted);
        }
        last_updated = [no,posts,uips,post_hilight,last_updated[2]!=uips,posts_deleted];
        post_uip.push(last_updated);
        waste_count = 0;
      } else waste_count++;
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
      if (pref.uip_tracker.on) {
        if (pref.uip_tracker.adaptive){
          if (waste_count==0) interval = interval_pref;
          else if (waste_count>=8) {
            waste_count=0;
            interval *= 2;
            if (interval>=3600) interval=3600;
          }
        }
//        if (status!=404) setTimeout(uip_check,interval*1000);
        var p0 = obj.posts[0];
        if (!p0['archived'] && !p0['closed'] && status!=404) setTimeout(uip_check,interval*1000);
        else uip_tracker = null;
      } else uip_tracker = null;
    }
  }
  var uip_tracker=null;
  uip_tracker_init();
  function uip_tracker_init(){
    if (uip_tracker===null && site.features.uip_tracker && site.isthread && pref.uip_tracker.on) uip_tracker = make_uip_tracker();
    else if (!pref.uip_tracker.on) uip_tracker = null;
  }

  function make_catalog_obj(pn12){
    pn12.addEventListener('click', show_hide, false); // show_hide
    var catalog_func = null;
    function show_hide(){
      if (catalog_func==null) catalog_func = make_catalog();
      else catalog_func = catalog_func.destroy();
    }

    function scan_tags_common(ths,html_str){
      var tags_obj = {};
      for (var i in ths) {
        var tags_th = ths[i].tags;
        if (tags_th) {
//          var tags_th_uniq = {};
//          for (var j=0;j<tags_th.length;j++) tags_th_uniq[tags_th[j]] = null;
//          for (var j in tags_th_uniq)
//            if (tags_obj[j]===undefined) tags_obj[j] = 1;
//            else tags_obj[j]++;
          var tags_th_uniq = {};
          for (var j=tags_th.length-1;j>=0;j--)
            if (tags_th_uniq[tags_th[j]]===undefined) tags_th_uniq[tags_th[j]] = null;
            else tags_th.splice(j,1);
          if (tags_th.length<=pref.catalog.tag.max) {
            var end = (pref.catalog.tag.ignore<tags_th.length)? pref.catalog.tag.ignore : tags_th.length;
            for (var j=0;j<end;j++)
              if (tags_obj[tags_th[j]]===undefined) tags_obj[tags_th[j]] = 1;
              else tags_obj[tags_th[j]]++;
          } 
        }
      }
      var tags = [];
      for (var i in tags_obj) tags.push({key:i, val:tags_obj[i]});
      tags.sort(function(a,b){return b.val - a.val;});
      if (pref.catalog.filter.tag_ci) {
        for (var i=0;i<tags.length-1;i++)
          for (var j=tags.length-1;j>i;j--) {
            var key = tags[j].key.replace(/[\*\(\)]/g,'\\$&');
            if (tags[i].key.search(new RegExp(key,'i'))!=-1) {
              tags[i].val += tags[j].val;
              tags.splice(j,1);
            }
          }
        tags.sort(function(a,b){return b.val - a.val;});
      }
      var str2 = '';
      for (var i=0;i<tags.length;i++) {
        var item = tags[i].val + ': ' + tags[i].key;
        str2 = str2 + '<input type="checkbox"' + html_str + '> '+item + '<br>';
      }
      return str2;
    }

    function make_catalog(){
//      var threads = []; // This makes non-associative array.
      var threads = {}; // This makes object.
      var threads_idx = [];

      var pn12_0_4 = document.createElement('div');
//      var pn12 = cnst.init('left:0px:tile:get:bottom:resize:both:Show:tb:width:400px:height:400px:resize:both:overflow:auto',cnst.void_func,cnst.void_func,show_hide,show_catalog_cont);
      var pn12_whole = cnst.init('left:0px:tile:get:bottom:resize:both:Show:tb:width:400px:height:400px:resize:both:overflow:auto',
        function(){pn12_0_4.style.display='';},function(){pn12_0_4.style.display='none';},show_hide,show_catalog_cont);
      var pn12 = pn12_whole[0];
      var pn12_rollup_func = pn12_whole[1];
//      var pn12 = cnst.init('left:0px:tile:get:bottom:resize:both:Show:tb:',cnst.void_func,cnst.void_func,show_hide,show_catalog_cont);
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
        '<input type="checkbox" name="catalog.filter.show"> Filter ' +
        '<input type="checkbox" name="catalog_show_setting"> Settings'+
        '<button name="refresh">Refresh</button> up to <input type="text" name="catalog_max_page" size="2" style="text-align: right;">pages in '+
        '<select name="catalog_board_list_sel"></select>');
      pref_func.apply_prep(pn12_0_2,false);
      pn12_1.style.width = pn12_0.offsetWidth + 'px';
//      pn12_0_2.getElementsByTagName('input')['catalog.filter.show'].onchange = function(){pref_func.apply_prep(pn12_0_2,true);cnst.show_hide(pn_filter);}; // working code.
//      pn12_0_2.getElementsByTagName('input')['catalog_show_setting'].onchange = function(){pref_func.apply_prep(pn12_0_2,true);cnst.show_hide(pn_setting);};
//      pn12_0_2.getElementsByTagName('button')['refresh'].onclick  = function(){catalog_refresh(true);};
//      pn12_0_2.getElementsByTagName('input')['catalog_max_page'].onchange = function(){pref_func.apply_prep(pn12_0_2,true);};
//      pn12_0_2.getElementsByTagName('select')['catalog_board_list_sel'].onchange = function(){pref_func.apply_prep(pn12_0_2,true);catalog_refresh(false);};
      var board_sel = pn12_0_2.getElementsByTagName('select')['catalog_board_list_sel'];
      pref_func.board_sel = board_sel;

      pn12_0_4.style.background = '#e5ecf9';
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
            '&emsp;<input type="text" name="catalog.max_threads" size="3" style="text-align: right;">th at update<br>'+
            '<button name="clear_threads">Clear</button>'+
          '</div>'+
          '<div style="float:right">'+
            '<select name="catalog.indexing"><option>Last reply</option><option>Creation date</option><option>Reply count</option><option>Image count</option></select><br>'+
            'size <input type="text" name="catalog_size_width" size="4" style="text-align: right;"> x '+
            '<input type="text" name="catalog_size_height" size="4" style="text-align: right;">'+
          '</div>'+
        '</div>'+
        '<div align="left" style="float:left"><input type="checkbox" name="catalog.filter.kwd"> Keyword :'+
          '<textarea rows="1" cols="40" name="catalog.filter.kwd_str"></textarea>'+
          '<input type="radio" name="catalog.filter.kwd_match" value="match"> match'+
          '<input type="radio" name="catalog.filter.kwd_match" value="unmatch"> unmatch'+
          '<input type="checkbox" name="catalog.filter.kwd_re"> RE'+
          '<input type="checkbox" name="catalog.filter.kwd_ci"> Case insensitive<br>'+
          '<div style="float:left">'+
            '<input type="checkbox" name="catalog.filter.tag"> Tag :'+
          '</div>'+
          '<div style="float:left;overflow:auto;resize:both;" name="catalog.filter.tag_list"></div>'+
          '<button name="scan">scan</button>'+
//          '<textarea rows="1" cols="25" name="catalog.filter.tag_list_str"></textarea>'+
          '<input type="checkbox" name="catalog.filter.tag_scan_auto"> Auto'+
          '<input type="checkbox" name="catalog.filter.tag_ci"> Case insensitive<br>'+
          '<div style="clear:both"></div>'+
          '<input type="checkbox" name="catalog.filter.time"> Time: '+
          '<input type="checkbox" name="catalog.filter.time_mark"> Mark: '+
          '<textarea rows="1" cols="25" name="catalog.filter.time_str"></textarea>'+
          '<!-- <button name="now"><- Now</button> -->'+
          '<button name="ago"><- Ago</button>'+
          '<textarea rows="1" cols="6" name="catalog.filter.time_ago_str"></textarea><br>'+
          '<!-- &emsp;&emsp;<input type="checkbox" name="catalog.filter.time_track"> From the last post of the thread in which you click<br> -->'+
          '<!-- <textarea rows="1" cols="25" name="catalog.filter.time_mark_str"></textarea> -->'+
          '<!-- <button name="copy"><- From time filter</button><br> -->'+
          '<div style="float:left">'+
            '<input type="checkbox" name="catalog.filter.list"> Exclusive list: '+
            '<input type="checkbox" name="catalog.filter.list_mark_time"> Mark:<br>'+
            '<!-- &emsp;<input type="checkbox" name="catalog.filter.list_time_scroll"> Scroll to new post -->'+
            '<div style="clear:both">&emsp;<textarea rows="1" cols="30" name="catalog.filter.list_str"></textarea></div>'+
          '</div>'+
          '<div style="float:left">'+
            '<div style="float:left"><input type="checkbox" name="catalog.filter.attr_list"> Attribute list:<br></div>'+
            '<div style="clear:both">&emsp;<textarea rows="1" cols="30" name="catalog.filter.attr_list_str"></textarea></div>'+
          '</div>'+
          '<div style="float:left">'+
            '<input type="checkbox" name="catalog.filter.bookmark_list"> Bookmark list: '+
            '<input type="checkbox" name="catalog.filter.bookmark_list_rm404"> remove 404<br>'+
            '&emsp;<textarea rows="1" cols="30" name="catalog.filter.bookmark_list_str"></textarea>'+
          '</div>'+
          '<div style="float:left">'+
            '<button name="load">load</button><input type="checkbox" name="catalog.filter.load_auto"> Auto<br>'+
            '<button name="save">save</button><input type="checkbox" name="catalog.filter.save_auto"> Auto<br>'+
          '</div>'+
        '</div>'+
        '<div style="clear:both"></div>';

      if (pref.show_tooltip) pref_func.tooltips.add_hier(pn12_0_4);
      pref_func.apply_prep(pn12_0_4,false);
      pref_func.apply_prep(pn12_0_4,true); // obj init.
//      function catalog_setting_onchange_event(){
////console.log(this);
//        pref_func.apply_prep(this,true);
//        if (onchange_funcs[this.name]) onchange_funcs[this.name]();
//      }
      onchange_funcs = {
        'catalog.filter.show' : function(){cnst.show_hide(pn_filter,pn12_1);},
        'catalog_show_setting': function(){cnst.show_hide(pn_setting,pn12_1);},
        'refresh'             : function(){catalog_refresh(true);},
        'catalog_board_list_sel' : function(){
          if (pref.catalog.filter.save_auto) onchange_funcs.save();
          catalog_refresh(false);
          if (pref.catalog.filter.load_auto) onchange_funcs.load();
        },
        'catalog_size_width'  : catalog_resized,
        'catalog_size_height' : catalog_resized,
        'catalog.indexing'    : function(){
          threads_idx=[];
          for (var i in threads) insert_thread_idx(i);
          show_catalog();
        },
        'catalog_auto_update' : set_auto_update,
        'catalog_auto_update_period' : set_auto_update,
        'clear_threads'       : function(){catalog_clear_threads(0);show_catalog();},
        'load'                : function(){
          if (localStorage) {
            pref_func.pref_overwrite(pref.catalog.filter,JSON.parse(localStorage.getItem(onchange_funcs.load_save_key())));
            pref_func.apply_prep(pn_filter,false);
            pref_func.apply_prep(pn_filter,true); // make obj2.
          }
        },
        'save'                : function(){if (localStorage) localStorage.setItem(onchange_funcs.load_save_key(),JSON.stringify(pref.catalog.filter));},
        'load_save_key'       : function(){return pref.script_prefix + '.catalog.filter.' + pref.catalog_board_list_obj[board_sel.selectedIndex][0].key;},
        'catalog.filter.kwd_match' : catalog_filter_changed,
        'catalog.filter.kwd_ci'    : catalog_filter_changed,
        'catalog.filter.kwd_re'    : catalog_filter_changed,
        'catalog.filter.tag'       : catalog_filter_changed,
        'catalog.filter.tag_list'  : catalog_filter_changed,
        'scan'                     : scan_tags
      }
      pref_func.add_onchange(pn12_0_2,onchange_funcs);
      pref_func.add_onchange(pn12_0_4,onchange_funcs);
      
      var pn_setting = pn12_0_4.childNodes[0];
      if (!pref.catalog_show_setting) pn_setting.style.display = 'none';
      var pn_filter = pn12_0_4.childNodes[1];
      if (pref.catalog.filter.load_auto) onchange_funcs.load();
//      pn_setting.getElementsByTagName('input')['catalog_size_width' ].onchange = function(){pref_func.apply_prep(pn_setting,true);catalog_resized();}; // working code.
//      pn_setting.getElementsByTagName('input')['catalog_size_height'].onchange = function(){pref_func.apply_prep(pn_setting,true);catalog_resized();};
//      pn_setting.getElementsByTagName('select')['catalog.indexing'].onchange = function(){
//        pref_func.apply_prep(pn_setting,true);
//        threads_idx=[];
//        for (var i in threads) insert_thread_idx(i);
//        show_catalog();
//      }
//      var auto_update_period_old = 0; // working code.
      var auto_update_timer = null;
//      pn_setting.onchange = function(){
//        pref_func.apply_prep(pn_setting,true);
//        if (auto_update_period_old != pref.catalog_auto_update_period ||
//            ( pref.catalog_auto_update && !auto_update_timer) ||
//            (!pref.catalog_auto_update &&  auto_update_timer)) set_auto_update();
//      };
      function set_auto_update(){
        if (auto_update_timer) {clearTimeout(auto_update_timer);auto_update_timer=null;}
        if (pref.catalog_auto_update) {
          var period = pref.catalog_auto_update_period;
          auto_update_timer=setTimeout(function(){auto_update_timer=null;catalog_refresh(true);},period*60000);
//          auto_update_period_old = period;
        }
      }
      set_auto_update();
//      pn_setting.getElementsByTagName('button')['clear_threads'].onclick = function(){ // working code.
//        catalog_clear_threads(0);
//        show_catalog();
//      }

      if (!pref.catalog.filter.show) pn_filter.style.display = 'none';
      pn_filter.getElementsByTagName('textarea')['catalog.filter.kwd_str'].onkeyup = pn_filter_changed;
      var filter_time_str = pn_filter.getElementsByTagName('textarea')['catalog.filter.time_str'];
//      pn_filter.getElementsByTagName('button')['now'].onclick = function(){set_time_str(Date.now());}
      pn_filter.getElementsByTagName('button')['ago'].onclick= function(){
        var str = pn_filter.getElementsByTagName('textarea')['catalog.filter.time_ago_str'].value;
        var time = Date.now() - (parseInt(str.replace(/:.*/,''),10)*60+parseInt(str.replace(/[^:]*:/,''),10))*60000;
        set_time_str(time);
      }
      function set_time_str(time){
        filter_time_str.value = new Date(time).toLocaleString();
        pn_filter_changed();
      };
//      pn_filter.getElementsByTagName('button')['copy'].onclick =
//        function(){
//          pn_filter.getElementsByTagName('textarea')['catalog.filter.time_mark_str'].value=filter_time_str.value;
//          pn_filter_changed();
//        }
      var search_ex_list = pn_filter.getElementsByTagName('textarea')['catalog.filter.list_str'];
      search_ex_list.onkeyup = pn_filter_changed;
      var attr_list = pn_filter.getElementsByTagName('textarea')['catalog.filter.attr_list_str'];
      attr_list.onkeyup = pn_filter_changed;
      pn_filter.onchange = pn_filter_changed;
      function pn_filter_changed(){
        pref_func.apply_prep(pn_filter,true);
        catalog_filter_changed();
      }

      function scan_tags(){
        var ths = [];
        var j=0;
        for (var i in threads) {
          ths[j] = {};
          ths[j++].tags = threads[i][0][brwsr.innerText].match(/#[^#, \n]+(?=#|,| |\n|$)/g);
        }
        var str2 = scan_tags_common(ths,'');
//        var tags_obj = {};
//        for (var i in threads) {
//          var tags_th = threads[i][0][brwsr.innerText].match(/#[^#, \n]+(?=#|,| |\n|$)/g);
//          if (tags_th) {
////            var tags_th_uniq = {};
////            for (var j=0;j<tags_th.length;j++) tags_th_uniq[tags_th[j]] = null;
////            for (var j in tags_th_uniq)
////              if (tags_obj[j]===undefined) tags_obj[j] = 1;
////              else tags_obj[j]++;
//            var tags_th_uniq = {};
//            for (var j=tags_th.length-1;j>=0;j--)
//              if (tags_th_uniq[tags_th[j]]===undefined) tags_th_uniq[tags_th[j]] = null;
//              else tags_th.splice(j,1);
//            if (tags_th.length<=pref.catalog.tag.max) {
//              var end = (pref.catalog.tag.ignore<tags_th.length)? pref.catalog.tag.ignore : tags_th.length;
//              for (var j=0;j<end;j++)
//                if (tags_obj[tags_th[j]]===undefined) tags_obj[tags_th[j]] = 1;
//                else tags_obj[tags_th[j]]++;
//            } 
//          }
//        }
//        var tags = [];
//        for (var i in tags_obj) tags.push({key:i, val:tags_obj[i]});
//        tags.sort(function(a,b){return b.val - a.val;});
//        if (pref.catalog.filter.tag_ci) {
//          for (var i=0;i<tags.length-1;i++)
//            for (var j=tags.length-1;j>i;j--) {
//              var key = tags[j].key.replace(/[\*\(\)]/g,'\\$&');
//              if (tags[i].key.search(new RegExp(key,'i'))!=-1) {
//                tags[i].val += tags[j].val;
//                tags.splice(j,1);
//              }
//            }
//          tags.sort(function(a,b){return b.val - a.val;});
//        }
////        var str = '';
//        var str2 = '';
//        for (var i=0;i<tags.length;i++) {
//          var item = tags[i].val + ': ' + tags[i].key;
////          str  = str  + item + '\n';
//          str2 = str2 + '<input type="checkbox"> '+item + '<br>';
//        }
////        var pn_tag_list_str = pn_filter.getElementsByTagName('textarea')['catalog.filter.tag_list_str'];
////        pn_tag_list_str.value = str;
////        pref_func.apply_prep(pn_tag_list_str,true);
        var pn_tag_list = pn_filter.getElementsByTagName('div')['catalog.filter.tag_list'];
        pn_tag_list.innerHTML = str2;
        if (pn_tag_list.style.height=='') pn_tag_list.style.height = '30px';
        if (pn_tag_list.style.width=='') pn_tag_list.style.width = '100px';
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

      var pn12_triage = document.createElement('div');
      pn12_triage.style.position = 'absolute';
      pn12_triage.name = 'catalog_triage';
//      pn12_triage.innerHTML = '\
//<button>Go to trash box</button><br>\
//<button>I\'ve read all</button>\
//';
      function triage_factory(i,j){return function(){triage(i,j);};}
//      var pn12_triage_text = ['\u2715','\u2713','O'];
      var pn12_triage_text = ['X','v','O'];
//      var pn12_triage_style_str = ['background:','background:#c3dcf9','background:#b8efc2','background:#efedbe','background:#fbd5fb','background:#fac2c5'];
//      var pn12_triage_style_str = JSON.parse(pref.catalog_triage_str.replace(/\/\/.*/mg,''));
      var triage_str_lines = pref.catalog_triage_str.replace(/\/\/.*/mg,'').split('\n');
      for (var i=triage_str_lines.length-1;i>=0;i--) if (triage_str_lines[i]==='') triage_str_lines.splice(i,1);
      var triage_str = [];
      var triage_style_replace_list = (!brwsr.ff)? ['background','background-color'] : [];
      for (var i=0;i<triage_str_lines.length;i++)
        triage_str[i] = triage_str_lines[i].split(',');
      for (var i=0;i<triage_str.length;i++) {
        for (var j=0;j<triage_str[i].length;j+=3) {
          var tmp = document.createElement('button');
          tmp.innerHTML = triage_str[i][j+1];
          var triage_styles = triage_str[i][j+2].split(';');
          for (var k=0;k<triage_styles.length;k++) {
//            var style_str = triage_styles[k].replace(/:.*/,'').replace('background','background-color'); //.replace('border','border-style');
            var style_str = triage_styles[k].replace(/:.*/,'');
            for (var m=0;m<triage_style_replace_list.length;m+=2) style_str = style_str.replace(triage_style_replace_list[m],triage_style_replace_list[m+1]);
            tmp.style[style_str] = triage_styles[k].replace(/[^:]*:/,'');
          }
//          var background = pn12_triage_style_str[j].match(/background:.*(;|$)/);
//          if (background!=null) tmp.style['background-color'] = background[0].replace(/[^:]*:/,'').replace(/;.*/,'');
//          var border = pn12_triage_style_str[j].match(/border:.*(;|$)/);
//          if (border!=null) tmp.style['border-style'] = border[0].replace(/[^:]*:/,'').replace(/;.*/,'');
          tmp.onclick = triage_factory(i,j);
          pn12_triage.appendChild(tmp);
        }
        var tmp = document.createElement('br');
        pn12_triage.appendChild(tmp);
      }
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
      function triage(i,j){
        var name = pn12_triage_thread;
        var key = new RegExp('(^|,)'+name +'([%@][^,\n]*)*(,|\n|$)','mg');
        var ex_str = search_ex_list.value.replace(key,',');
        if (triage_str[i][j].search(/KILL|TIME/)!=-1) {
          var datetime = threads[name][8][0] + pref.localtime_offset*3600000;
          var millisec = threads[name][8][0]%1000;
          ex_str = ex_str + ',' + name
            + ((triage_str[i][j].search(/TIME/)!=-1)? 
              '@' + new Date(datetime).toLocaleString() + ((millisec==0)? '' : '.'+millisec ) : '') +'\n';
        }
        search_ex_list.value = ex_str.replace(/,,+/g,',').replace(/^,/g,'').replace(/\n,/g,'\n');
        var at_str = attr_list.value.replace(key,',') + ((triage_str[i][j+2]!=='')? ',' + name + '%'+triage_str[i][j+2] : '') +'\n';
        attr_list.value = at_str.replace(/,,+/g,',').replace(/^,/g,'').replace(/\n,/g,'\n');
        pref_func.apply_prep(search_ex_list,true);
        pref_func.apply_prep(attr_list,true);
        catalog_attr_set(name,threads[name][0]);
        catalog_filter_changed();
//        catalog_triage_out();
      }
//      pn12_triage.addEventListener('mouseover', catalog_triage_out_clear, false);
//      pn12_triage.addEventListener('mouseout' , catalog_triage_out_delay, false);
      pn12_triage.onmouseover = triage_in;
      pn12_triage.onmouseout  = triage_out;
      var pn12_triage_thread = null;
      var pn12_triage_timer = null;
      function catalog_triage_in(name){
        if (pref.catalog_triage) { // working.
          if (!pn12_triage_thread) pn12_triage = pn12_1.appendChild(pn12_triage);
          else {
            catalog_triage_out_clear();
            if (pn12_triage_thread == name) return; // for faster execution.
            threads[pn12_triage_thread][0].removeEventListener('mouseout', catalog_triage_out_delay, false);
          }
          pn12_triage.style.left  = threads[name][0].offsetLeft - pn12_1.scrollLeft + 'px';
          var top = threads[name][0].offsetTop  - pn12_1.scrollTop;
          if (top<pn12_1.offsetTop) top = pn12_1.offsetTop;
          pn12_triage.style.top   = top + 'px';
          pn12_triage_thread = name;
          threads[name][0].addEventListener('mouseout', catalog_triage_out_delay, false);
        } else catalog_triage_out();
      }
      if (pref.show_tooltip) pref_func.tooltips.add(pn12_triage);
      function triage_in(e){
//        if (pref.show_tooltip) pref_func.show_tooltip('catalog_triage',e.clientX,e.clientY);
        catalog_triage_out_clear();
      }
      function catalog_triage_out_clear(){
        if (pn12_triage_timer) {clearTimeout(pn12_triage_timer);pn12_triage_timer=null;}
      }
      function triage_out(e){
//        if (pref.show_tooltip) pref_func.hide_tooltip('catalog_triage',e.clientX,e.clientY);
        catalog_triage_out_delay();
      }
      function catalog_triage_out_delay(){
        if (!pn12_triage_timer) pn12_triage_timer = setTimeout(catalog_triage_out,pref.catalog_popdown_delay);
      }
      function catalog_triage_out(){
        if (pn12_triage_thread) {
          threads[pn12_triage_thread][0].removeEventListener('mouseout', catalog_triage_out_delay, false);
          pn12_triage = pn12_1.removeChild(pn12_triage);
          pn12_triage_thread = null;
        }
      }

      function trim_html(src,nickname,format,date){
        if (!format.fileinfo) site2[nickname].remove_files_info(src);
        if (!format.posts)    site2[nickname].remove_posts(src,0);
        if (format.contents)  site2[nickname].format_thread_contents(src);
        if (format.layout)    site2[nickname].format_thread_layout(src);
        if (format.style)     site2[nickname].format_thread_style(src);
                        site2[nickname].format_thread_always(src);
        if (pref.catalog_localtime) site2[nickname].format_time(src);
        if (pref.catalog.filter.time_mark) site2[nickname].mark_newer_posts(src,date);
      }
      function insert_thread(src, nickname, boardname, op_no, page_no, nof_posts, nof_files, snoop, date_load){
        var name = nickname + boardname + op_no;
        if (snoop && !pref.catalog_promiscuous && !threads[name]) {
          var hit = false;
          for (var i=0;i<refresh_tgts.length;i++)
            if (refresh_tgts[i].indexOf(nickname+boardname+'p'+page_no)!=-1 ||
                refresh_tgts[i].indexOf(nickname+boardname+op_no)!=-1) {hit=true;break;}
          if (!hit) return 0;
        }
        var date = site2[nickname].get_time_of_posts(src);
        if (threads[name] && threads[name][13]<date_load) update_page_in_footer(name,page_no,date_load);
        if (threads[name] && threads[name][8][0]>=date[0]) return 0;
//console.log('In :'+name);
        var url = site2[nickname].get_thread_link(src,boardname,pref.catalog_click!='expand',name);
//        var date_mark = Date.parse(pref.catalog.filter.time_mark_str) - pref.localtime_offset*3600000;
        var date_mark = Date.parse(pref.catalog.filter.time_str) - pref.localtime_offset*3600000;
//        console.log(name+', '+date);
//        var src1 = document.createElement('div');
//        src1.innerHTML = src.innerHTML;
        var html_org = src.innerHTML;
        var src2 = document.createElement('div');
        src2.innerHTML = src.innerHTML;
        var cross_domain = pref.catalog_board_list_obj[board_sel.selectedIndex][0]['domain']!=nickname;
        var cross_board  = pref.catalog_board_list_obj[board_sel.selectedIndex][0]['board']!=boardname;
        date = date.concat(site2[nickname].insert_footer(src,page_no,((cross_domain)? nickname : '')+((cross_board)? boardname : ''),pref.catalog_footer,date,nof_posts,nof_files));
        trim_html(src,  nickname, pref.catalog_format.show, date_mark);
//        trim_html(src1, nickname, pref.catalog_format.hover, date_mark);
        trim_html(src2, nickname, pref.catalog_format.search, date_mark);
        var ch = threads[name];
        if (ch==undefined) {
          ch = document.createElement('div');
          ch.style.width  = pref.catalog_size_width + 'px';
          ch.style.height = pref.catalog_size_height + 'px';
          ch.style.float = 'left';
          ch.style.overflow = 'hidden';
//          var bk_color_catalog = (pref.catalog_enable_background)? site2[nickname].catalog_background : 'none';
//          var bk_color_popup   = (pref.catalog_enable_background)? site2[nickname].catalog_background : '#e5ecf9';
          ch.style.background = '#e5ecf9';
//          ch.style.background = bk_color_catalog;
//          ch.style.border = (pref.catalog_border_show)? pref.catalog_border+' '+site2[nickname].catalog_bordercolor : 'none';
          var func_in     = make_func_in(name); // to reduce footprint.
          var func_pop_up = make_func_pop_up(name);
          var click_func  = make_func_click(name);
////          var pop_up_func = function(e){pop_up_delay(e,name);catalog_triage_in(name);};
//          var func_in     = function(e){pop_up_delay(e,name);catalog_triage_in(name);};
//          var func_pop_up = function(e){pop_up_delay(e,name);};
////          var click_func = function(e){e.stopPropagation();click_thread(name);};
//          var click_func = function(e){click_thread(name);};
//          threads[name] = [ch, false, pop_up_func, src1.innerHTML, src2[brwsr.innerText], click_func, null, url, date, true, bk_color_popup];
          threads[name] = [ch, false, [func_in, func_pop_up],
                           [html_org, nickname],
                           src2[brwsr.innerText], click_func, null, url, date, true,
//                           src2[brwsr.innerText].match(/#[^, \n]*(?=,| |\n|$)/g),
                           null,
                           null, null, date_load, page_no, 0];
          ch.addEventListener('mouseover', func_in, false);
          ch.addEventListener('click', click_func, true);
          if (pref.catalog_expand_at_initial) expand_shrink_thread(name);
        } else {
          for (var i=0;i<threads_idx.length;i++) if (threads_idx[i]==name) {threads_idx.splice(i,1);break;}
          ch = threads[name][0];
        }
        ch.innerHTML = src.innerHTML;
//        threads[name][3] = src1.innerHTML;
        threads[name][3][0] = html_org;
        threads[name][4] = src2[brwsr.innerText];
        threads[name][8] = date;
        threads[name][9] = catalog_filter_query(name);
        if (threads[name][11]) threads[name][11] = remove_open_new_thread_event(threads[name][11]);
        threads[name][11] = add_open_new_thread_event(name,site2[nickname].modify_thread_link(ch));
        return insert_thread_idx(name);
      }
      function make_func_in(name){return function(e){pop_up_delay(e,name);catalog_triage_in(name);};} // to reduce footprint
      function make_func_pop_up(name){return function(e){pop_up_delay(e,name);};}
      function make_func_click(name){return function(e){click_thread(name);};}
      function insert_thread_idx(name){
        var indexing = pref.catalog.indexing;
        var date = threads[name][8][indexing];
        var ref=0;
        while (ref<threads_idx.length && date<=threads[threads_idx[ref]][8][indexing]) ref++;
        if (ref==threads_idx.length) threads_idx.push(name);
        else threads_idx.splice(ref,0,name);
//        console.log(threads_idx);
//        show_catalog();
        return ref;
      }
      function expand_shrink_thread(name){
        if (pref.catalog_click=='expand') {
          if (threads[name][0].style.width=='') {
            threads[name][0].style.width = pref.catalog_size_width + 'px';
            threads[name][0].style.height = pref.catalog_size_height + 'px';
          } else {
            threads[name][0].style.width = '';
            threads[name][0].style.height = '';
          }
        }
      }
      function click_thread(name){
        if (pref.catalog_click=='expand') {
          if (!(pref.catalog.filter.time && pref.catalog.filter.time_track)) expand_shrink_thread(name);
        } else open_new_thread(threads[name][7], name);
        if (pref.catalog.filter.time_track) set_time_str(threads[name][8][0]+pref.localtime_offset*3600000);
      }

      function add_open_new_thread_event(name,args){
        for (var i=0;i<args.length;i++) {
          var elem = args[i][0];
          var url  = args[i][1];
          var func = function(){open_new_thread(url, name);expand_shrink_thread(name);};
          elem.addEventListener('click', func, false);
          args[i][1] = func;
        }
        return args;
      }
      function remove_open_new_thread_event(args){
        for (var i=0;i<args.length;i++) args[i][0].removeEventListener('click', args[i][1], false);
        return null;
      }
      function get_mark_time(name){
        var date_mark = -1;
//        if (pref.catalog.filter.time_mark) date_mark = Date.parse(pref.catalog.filter.time_mark_str) - pref.localtime_offset*3600000;
        if (pref.catalog.filter.time_mark) date_mark = Date.parse(pref.catalog.filter.time_str) - pref.localtime_offset*3600000;
        if (pref.catalog.filter.list_mark_time) {
          var time_list = catalog_filter_query_time_list(name)[1];
          if (time_list) date_mark = time_list;
        }
        return date_mark;
      }
      function open_new_thread(url, name){
//console.log(url);
//        var cw = window.open(url,(pref.catalog_open_in_new_tab)? '_blank' : '_self');
        var window_name = (pref.catalog_open_in_new_tab)? ((pref.catalog_use_named_window)? name : '_blank') : '_self';
        var cw = window.open(url,window_name);
        send_message(window_name, [['MARK',get_mark_time(name)]],cw);
      }

      var all_drawn = false;
      function show_catalog_cont(){
        if (!all_drawn) show_catalog();
      }
      function show_catalog(){
        all_drawn = false;
        catalog_triage_out();
        pref_func.tooltips.hide();
        var drawn_y = 0;
        var ref_count = 0;
        for (var i=0;i<threads_idx.length;i++) {
          if ((!pref.catalog_draw_on_demand) || drawn_y<pn12_1.scrollTop + pn12_1.clientHeight*1.5) {
            var name = threads_idx[i];
            if (name==='url') {
              threads_idx.splice(i,1);
              get_page(true);
            } else {
              var ch = threads[name][0];
              if (threads[name][9][0]) {
                var ref = pn12_1.childNodes[ref_count];
                if (ref==undefined) ch = pn12_1.appendChild(ch);
                else ch = pn12_1.insertBefore(ch,ref);
                var nickname = name.replace(/\/.*/,'');
                if (pref.catalog.filter.list_mark_time && threads[name][9][1]) site2[nickname].mark_newer_posts(ch,threads[name][9][1]);
                if (!brwsr.ff) catalog_attr_set(name,ch);
                if (!threads[name][1]) {
                  if (brwsr.ff) {
                    ch.setAttribute('style','float: left');
                    ch.style.width  = pref.catalog_size_width + 'px';
                    ch.style.height = pref.catalog_size_height + 'px';
                    ch.style.overflow = 'hidden';
                    ch.style.resize ='both';
                    catalog_attr_set(name,ch);
                  }
                  threads[name][0] = ch;
                  threads[name][1] = true;
//                  threads[name][11] = add_open_new_thread_event(name,site2[nickname].modify_thread_link(ch));
//                  console.log(ch.offsetTop +', ' + i + ', ' + name);
                }
                drawn_y = ch.offsetTop;
                ref_count++;
              } else if (threads[name][1] && !threads[name][9][0]) {
                if (pop_up_status[name]) pop_down_event(name);
//                threads[name][11] = remove_open_new_thread_event(threads[name][11]);
                ch = pn12_1.removeChild(ch);
                threads[name][0] = ch;
                threads[name][1] = false;
              }
              drawn_y = ch.offsetTop;
              if (i==threads_idx.length-1) all_drawn = true;
            }
          } else break;
        }
      }
      pn12_1.addEventListener('scroll', show_catalog_cont, false);

      function catalog_attr_set(name,pn){
        var val = null;
        if (pref.catalog.style_general_list) val = catalog_obj_merge(name,pref.catalog.style_general_list_obj2,val);
        if (pref.catalog.filter.attr_list)   val = catalog_obj_merge(name,pref.catalog.filter.attr_list_obj2,val);
        if (val && val.style) {
//          var styles = val.style.split(';');
//          for (var i=0;i<styles.length;i++) {
//            var stl = styles[i].split(':');
//            pn.style[stl[0]] = stl[1];
//          }
          for (var stl in val)
            if (stl.indexOf('style')==0) pn.style[stl.substr(6)] = val[stl];
        }
      }
    
      function catalog_obj_merge(name,obj,val){
        var dbt = cnst.name2domainboardthread(name,true);
        if (val===null) val = {hit:false};
        val = catalog_obj_merge_1(val,obj,'DEFAULT');
        val = catalog_obj_merge_1(val,obj,dbt[0]); // domain
        val = catalog_obj_merge_1(val,obj,dbt[1]); // board
        val = catalog_obj_merge_1(val,obj,dbt[0]+dbt[1]); // domain+board
        val = catalog_obj_merge_1(val,obj,dbt[2]); // thread
        val = catalog_obj_merge_1(val,obj,dbt[0]+dbt[2]); // domain+thread
        val = catalog_obj_merge_1(val,obj,dbt[1]+dbt[2]); // board+thread
        val = catalog_obj_merge_1(val,obj,name);
        return val;
      }
      function catalog_obj_merge_1(val,obj,key){
        if (obj[key]) {
          for (var i in obj[key]) val[i] = obj[key][i];
          val.hit = true;
        }
        return val;
      }
      function catalog_filter_query(name){
        var kwd = pref.catalog.filter.kwd_str;
        if (pref.catalog.filter.kwd && kwd!=='') {
          if (!pref.catalog.filter.kwd_re) kwd = kwd.replace(/\*/g,'.*');
          if (pref.catalog.filter.kwd_ci) kwd = new RegExp(kwd,'i');
          var str = threads[name][4];
          var result = (str.search(kwd)!=-1);
          var match = (pref.catalog.filter.kwd_match==='match');
          if ((match && !result) || (!match && result)) return [false];
        }
        if (pref.catalog.filter.tag) {
          var pn_tag_list = pn_filter.getElementsByTagName('div')['catalog.filter.tag_list'];
          var cbxes = pn_tag_list.getElementsByTagName('input');
          var tags = '';
          for (var i=0;i<cbxes.length;i++)
            if (cbxes[i].checked) tags = tags + cbxes[i].nextSibling.textContent.replace(/ [0-9]*: /,'').replace(/$/,'(#|,| |\n|$)') + '|';
          if (tags!=='') {
            tags = tags.replace(/\|$/,'');
            if (pref.catalog.filter.tag_ci) tags = new RegExp(tags,'i');
            var str = threads[name][0][brwsr.innerText];
            if (str.search(tags)==-1) return [false];
          }
        }
        if (pref.catalog.filter.time) {
          var time = Date.parse(pref.catalog.filter.time_str) - pref.localtime_offset*3600000;
          if (threads[name][8][0]<=time) return [false];
        }
        if (pref.catalog.filter.list) return catalog_filter_query_time_list(name);
//        else if (pref.catalog.filter.list_mark_time) [true, get_mark_time(name)];
        else return [true];
      }
      function catalog_filter_query_time_list(name){
        var val = catalog_obj_merge(name,pref.catalog.filter.list_obj2,null);
        if (val.time && val.time<threads[name][8][0]) return [true, val.time];
        else if (val.hit) return [false, val.time];

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
        if (pref.catalog.filter.kwd || pref.catalog.filter.tag || pref.catalog.filter.time || pref.catalog.filter.list) for (var th in threads) threads[th][9] = catalog_filter_query(th);
//        if (pref.catalog.filter.kwd || pref.catalog.filter.time || pref.catalog.filter.list || pref.catalog.filter.list_mark_time) for (var th in threads) threads[th][9] = catalog_filter_query(th); // cause error.
        else for (var th in threads) threads[th][9] = [true];
        show_catalog();
      }
      function catalog_attr_changed(){
        if (pref.catalog.filter.attr_list)
          for (var th in threads) catalog_attr_set(th,threads[th][0]);
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
      var pop_up_status = {};
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
        trim_html(pn, threads[name][3][1], pref.catalog_format.hover, get_mark_time(name));
        var nickname = name.replace(/\/.*/,'');
        if (pref.catalog.filter.list_mark_time && threads[name][9][1]) site2[nickname].mark_newer_posts(pn,threads[name][9][1]);
        threads[name][12] = add_open_new_thread_event(name,site2[nickname].modify_thread_link(pn));
        pn.style.background = '#e5ecf9';
        catalog_attr_set(name,pn);
        pn = document.getElementsByTagName('body')[0].appendChild(pn);
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

      var refresh_idx = 0;
      var refresh_tgts;
      var refresh_use_cache = false;
      function make_refresh_list(){
//      function make_refresh_list(remove_attr){
        var tgts = [];
//        if (pref.catalog.filter.bookmark_list) tgts = pref.catalog.filter.bookmark_list_str.replace(/\n/g,',').replace(/,,+/,',').split(',');
        if (pref.catalog.filter.bookmark_list) tgts = pref.catalog.filter.bookmark_list_str.replace(/\/\/.*$/mg,',').replace(/\n/g,',').replace(/,,+/g,',').replace(/^,/,'').replace(/,$/,'').split(',');
        if (tgts[0]==='') tgts = [];
        if (pref.catalog.on_bt_page && board_sel.selectedIndex==0) pref_func.str2obj('catalog_board_list_str');
        var blist = pref.catalog_board_list_obj[board_sel.selectedIndex];
        for (var j=0;j<pref.catalog_max_page;j++)
          for (var i=1;i<blist.length;i++)
            if (blist[i]['key'].search(/[^\/]*\/[^\/]*\/[0-9]+/)!=-1 && j==0) tgts.push(blist[i]['key']);
            else if (!blist[i]['num'] || j<blist[i]['num']) tgts.push(blist[i]['key']+'p'+j);
//        if (remove_attr) for (var i=0;i<tgts.length;i++) tgts[i] = tgts[i].replace(/!.*/,'');
        if (pref.catalog.board.ex_list) {
          for (var i=tgts.length-1;i>=0;i--) {
            var val = catalog_obj_merge(tgts[i],pref.catalog.board.ex_list_obj2,null);
            if (val.hit) tgts.splice(i,1);
          }
        }
        return tgts;
      }
      function catalog_clear_threads(num){
        catalog_triage_out();
        while (threads_idx.length>num) {
          var name = threads_idx[threads_idx.length-1];
          if (name!=='url') {
            threads[name][0].removeEventListener('mouseover', threads[name][2][0], false);
            threads[name][0].removeEventListener('click', threads[name][5], false);
            if (threads[name][11]) remove_open_new_thread_event(threads[name][11]);
            if (threads[name][1]) {
//              if (threads[name][12]) remove_open_new_thread_event(threads[name][12]);
              if (pop_up_status[name]) pop_down_op(name);
              pn12_1.removeChild(threads[name][0]);
            }
          }
          delete threads[name];
          threads_idx.splice(threads_idx.length-1,1);
        }
      }
      function catalog_refresh(refresh) {
//console.log('refresh')
        set_auto_update();
        refresh_use_cache = !refresh;
//        for (var i=0;i<=site.max_page;i++) page_delim_idx[i] = 0;
//        var catalog_max_page = pref.catalog_max_page;
//        if (catalog_max_page>site.max_page) catalog_max_page = site.max_page;
        refresh_idx = 0;
//        refresh_num = catalog_max_page;
//        refresh_num *= pref.catalog_board_list_obj[board_sel.selectedIndex].length-1;
//        refresh_tgts = [];
////        if (pref.catalog.filter.bookmark_list) refresh_tgts = pref.catalog.filter.bookmark_list_str.replace(/\n/g,',').replace(/,,+/,',').split(',');
//        if (pref.catalog.filter.bookmark_list) refresh_tgts = pref.catalog.filter.bookmark_list_str.replace(/\/\/.*\n/,',').replace(/\n/g,',').replace(/,,+/,',').split(',');
//        if (refresh_tgts[refresh_tgts.length-1]==='') refresh_tgts.pop();
//        var blist = pref.catalog_board_list_obj[board_sel.selectedIndex];
//        for (var j=0;j<pref.catalog_max_page;j++)
//          for (var i=1;i<blist.length;i++)
//            if (blist[i]['key'].search(/[^\/]*\/[^\/]*\/[0-9]+/)!=-1 && j==0) refresh_tgts.push(blist[i]['key']);
//            else if (!blist[i]['num'] || j<blist[i]['num']) refresh_tgts.push(blist[i]['key']+'p'+j);
        refresh_tgts = make_refresh_list();
        if (refresh && pref.catalog_refresh_clear) catalog_clear_threads(pref.catalog.max_threads);
//        if (refresh) { // working code.
//          if (pref.catalog_refresh_clear) {
//            catalog_triage_out();
//            for (var name in threads) {
//              threads[name][0].removeEventListener('mouseover', threads[name][2][0], false);
//              threads[name][0].removeEventListener('click', threads[name][5], false);
//              if (threads[name][1]) {
//                if (threads[name][11]) remove_open_new_thread_event(threads[name][11]);
////                if (threads[name][12]) remove_open_new_thread_event(threads[name][12]);
//                if (pop_up_status[name]) pop_down_op(name);
//                pn12_1.removeChild(threads[name][0]);
//              }
//            }
//            threads = {};
//            threads_idx = [];
//          }
//        }
        if (refresh_idx<refresh_tgts.length) get_page();
      }
//      catalog_refresh(false);
      var flag_initial_refresh = pref.catalog.on_bt_page && pref.catalog.refresh.except_bt;
      catalog_refresh(pref.catalog.refresh.initial && !pref.catalog.on_bt_page);

      function catalog_insert(key,cached_info) {
        if (cached_info==null) return;
//        var page_no = (key.substr(0,info_raw.length)==info_raw)? parseInt(key.substr(info_raw.length),10) : site.max_page;
//        if ((!pref.catalog_enable_cross_board) && page_no>=site.max_page) return;
        var value = JSON.parse(cached_info);
//        var nickname = key.replace(/\/.*/,'');
//        var page_no = key.replace(/[^\/]*\//,'').replace(/[^\/]*\//,'');
//        var board_name = key.substr(nickname.length,key.length-nickname.length-page_no.length);
//        catalog_insert2(nickname,board_name,page_no,value[1]);
        catalog_insert2(key,value[0],value[1],true);
      }
      function catalog_insert2(key,date,doc_txt,snoop) {
        var dbt = cnst.name2domainboardthread(key,true);
        var nickname = dbt[0];
        var board = dbt[1];
        var page_read = dbt[2].indexOf('p')==0;
        var page_no = (page_read)? dbt[2].substr(1) : '?';
        var thread = dbt[2];

        var name = nickname + board + thread;
        if (snoop && !pref.catalog_promiscuous && !page_read && !threads[name]) {
          var hit = false;
//          var name = nickname + board + thread;
          for (var i=0;i<refresh_tgts.length;i++) if (refresh_tgts[i].indexOf(name)!=-1) {hit=true;break;}
          if (!hit) return 0; // return if no interest.
        }

//        doc_txt = site2[nickname].preprocess_html(doc_txt,page_read); // cause memory leak.
        var doc = new DOMParser().parseFromString(doc_txt, 'text/html');
//        if (!page_read) site2[nickname].preprocess_doc(doc);
        site2[nickname].preprocess_doc(doc);
        var nof_posts = 0;
        var nof_files = 0;
        if (!page_read) {
          var nof_pi = site2[nickname].thread2headline(doc);
          nof_posts  = nof_pi[0];
          nof_files = nof_pi[1];
          nof_pi = null; // for test
          site2[nickname].add_thread_link(doc,site2[nickname].make_url3(board,thread));
        }
        if (site.nickname!=nickname || site.board!=board) site2[nickname].absolute_link(doc,board);
        var threads_in_page = site2[nickname].catalog_threads_in_page(doc);
        var th_no = site2[nickname].get_ops(doc);


        var inserted_idx = 0;
        for (var i=0;i<threads_in_page.length;i++) {
          inserted_idx = insert_thread(threads_in_page[i], nickname, board, th_no[i], page_no+((page_read && pref.show_page_fraction)? '.'+i : ''), (i==0)?nof_posts : 0, (i==0)?nof_files : 0, snoop, date);
        }
        show_catalog();
        if (pref.catalog.filter.tag_scan_auto) scan_tags();
        return inserted_idx;
      }
      function catalog_resized() {
        for (var i in threads) {
          threads[i][0].style.width  = (pref.catalog_size_width==0 )? '' : pref.catalog_size_width  + 'px';
          threads[i][0].style.height = (pref.catalog_size_height==0)? '' : pref.catalog_size_height + 'px';
        }
      }

//      var req = new XMLHttpRequest(); // working code
//      req.addEventListener('load',  req_events, false);
//      req.addEventListener('error', req_events, false);
//      req.addEventListener('abort', req_events, false);
//
//      function req_events(evt) {
//        var inserted_idx = 0;
//        if (req.status==200) {
//          if (pref.info_server && brwsr.sw_cache)
//            brwsr.sw_cache.setItem(url[0]+url[1]+url[2],JSON.stringify([cnst.get_time(), req.responseText]));
//          inserted_idx = catalog_insert2(url[0],url[1],url[2],req.responseText);
//        }
//        refresh_idx++;
//        if (refresh_idx<refresh_num) {
//          if (!pref.catalog_load_on_demand) get_page(true);
//          else {
//            if (threads_idx.length==inserted_idx+1) threads_idx.push(['url']);
//            else threads_idx.splice(inserted_idx+1,0,['url']);
////            threads_idx.splice(page_delim_idx[refresh_idx],0,['url']); // THIS MAKES SUBTLE BUG, insert point slides from here at snoop refresh, but ok to use, so I'll omit.
//            show_catalog();
//          }
//        }
//      }
//      function get_page(refresh){
//        var num = pref.catalog_board_list_obj[board_sel.selectedIndex].length-1;
//        var col = refresh_idx%num;
//        var row = parseInt(refresh_idx/num);
//        var bn = pref.catalog_board_list_obj[board_sel.selectedIndex][col+1];
//        url = site.make_url2(bn.key,row);
//        if (refresh) {
//          req.open('GET', url[3], true);
//          req.send(null);
//        } else {
//          brwsr.sw_cache.trygetItem(url[0]+url[1]+url[2],catalog_insert);
//          if (++refresh_idx<refresh_num) get_page(false);
//        }
//      }

      function req_events(date,status,response_txt) {
        var inserted_idx = 0;
        var key = refresh_tgts[refresh_idx].replace(/!.*/,'');
        if (status==200 && response_txt) {
//          inserted_idx = catalog_insert2(url[0],url[1],url[2],response_txt);
          inserted_idx = catalog_insert2(key,date,response_txt,false);
        } else if (status==404) comment_out_bookmark(key);
        refresh_idx++;
        if (refresh_idx<refresh_tgts.length) {
          if (!pref.catalog_load_on_demand) get_page();
          else {
            if (threads_idx.length==inserted_idx+1) threads_idx.push('url');
            else threads_idx.splice(inserted_idx+1,0,'url');
//            threads_idx.splice(page_delim_idx[refresh_idx],0,'url'); // THIS MAKES SUBTLE BUG, insert point slides from here at snoop refresh, but ok to use, so I'll omit.
            show_catalog();
          }
        } else {
          refresh_idx_page = 0;
          page_check_entry();
        }
      }
      function get_page(){
////        var num = pref.catalog_board_list_obj[board_sel.selectedIndex].length-1;
////        var col = refresh_idx%num;
////        var row = parseInt(refresh_idx/num);
////        var bn = pref.catalog_board_list_obj[board_sel.selectedIndex][col+1];
////        url = site.make_url2(bn.key,row);
////        if (refresh) http_req.get('catalog',url[0],url[1],url[2],url[3],req_events,false);
//        if (refresh) http_req.get('catalog',refresh_tgts[refresh_idx],'',req_events,false);
//        else {
////          brwsr.sw_cache.trygetItem(url[0]+url[1]+url[2],catalog_insert);
////          brwsr.sw_cache.trygetItem(refresh_tgts[refresh_idx],catalog_insert);
//          http_req.get('catalog',refresh_tgts[refresh_idx],'',req_events,true);
////          if (++refresh_idx<refresh_tgts.length) get_page(false);
//        }
        http_req.get('catalog',refresh_tgts[refresh_idx].replace(/!.*/,''),'',req_events,refresh_use_cache,true);
      }

      var refresh_idx_page;
      function page_check_entry(){
        while (refresh_idx_page<refresh_tgts.length) {
          if (refresh_tgts[refresh_idx_page].search(/!page/)==-1) refresh_idx_page++;
          else {
            var name = refresh_tgts[refresh_idx_page++].replace(/!.*/,'');
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
//          var url = (page_no==max_page)? site2[domain].make_url(dbt[1],thread) : site2[domain].make_url(dbt[1],page_no);
          key = (page_no==max_page)? domain+board+thread : domain+board+'p'+page_no;
//          http_req.get('catalog',key,url,req_events_page_check,refresh_use_cache);
          http_req.get('catalog',key,'',req_events_page_check,refresh_use_cache,true);
        }
        page_check();
        function req_events_page_check(date,status,response_txt) {
//console.log('Read : '+name+', '+key+', '+status);
          var callback_str = null;
          if (status!=200) {
            if (page_no==max_page && status==404) callback_str = 'Dead';
            else callback_str = 'HTTP'+status;
          } else {
            var doc = new DOMParser().parseFromString(response_txt, 'text/html');
            var ops = site2[domain].get_ops(doc);
            var hit = false;
            if (page_no!=max_page) for (var i=0;i<ops.length;i++) if (thread==ops[i]) {hit=true;callback_str = page_no+((pref.show_page_fraction)? '.'+i : '');}
            if (!hit) {
              if (response_txt != null && page_idx.length!=0) setTimeout(page_check, 0); // live cache make racing condition with this. I don't know why.
              else callback_str = '?' + ((!refresh_use_cache)? '(missing)' : '');
              if (site2[domain].check_thread_archived(doc)) callback_str = 'Archived';
            }
          }
          if (status==200) catalog_insert2(key,date,response_txt,true); // update
          if (callback_str!==null) {
            if (callback_str==='Dead' || callback_str==='Archived') {
              comment_out_bookmark(name);
//              var tgt = pn12_0_4.getElementsByTagName('textarea')['catalog.filter.bookmark_list_str'];
//              tgt.value = comment_out_key(name,tgt.value);
//              pref_func.apply_prep(tgt,true);
            }
            callback(name,callback_str,date);
          }
//console.log('Out : '+name+', '+key+', '+status);
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
        return str.replace(new RegExp(key+'(!page)*(,|\n|$)','g'),rep_str);
      }

      return {
        destroy: function(){ // destructor
          pref_func.board_sel = null;
          if (pref.catalog.filter.save_auto) onchange_funcs.save();
          pref_func.tooltips.remove(pn12_triage);
          pref_func.tooltips.remove_hier(pn12_0_4);
          pref_func.tooltips.hide();
          clearTimeout(auto_update_timer);
          document.getElementsByTagName('body')[0].removeChild(pn12);
          pn12_1.removeEventListener('scroll', show_catalog_cont, false);
          pn12.removeEventListener('dragstart', auto_hide_catalog, false);
          pn12.removeEventListener('dragend'  , auto_hide_catalog, false);
//          pn12_triage.removeEventListener('mouseover', catalog_triage_out_clear, false);
//          pn12_triage.removeEventListener('mouseout' , catalog_triage_out_delay, false);
          pn12 = null;
          return null;
        },
        catalog_insert: function(key,cache_info){catalog_insert(key,cache_info);}
      }
    }
    return {
      catalog_func: function(){return catalog_func;},
      scan_tags_common: scan_tags_common
    }
  }

  function make_chart_obj(pn1){
//  var chart_obj = (function(){
//    var pn1 = div_init(1,'5px',  '30px','button','Graph');
//    var pn1 = cnst.init('left:0px:tile:get:bottom:button:Graph:Show:tile:set:left:tile:set:bottom');
    pn1.addEventListener('click', show_hide, false);
    var data = chart_data_init();
    pref.graph.key = pref.script_prefix + '.graph.' + site.board;
    if (localStorage && pref.load_data && localStorage.getItem(pref.graph.key)!==null) data = brwsr.JSON_parse(localStorage.getItem(pref.graph.key));

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
          localStorage.setItem(pref.graph.key, JSON.stringify(data));
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
        pn7 = cnst.init('left:0px:tile:get:bottom:Show:tb',cnst.void_func,cnst.void_func,show_hide,cnst.void_func)[0];
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
//          '&emsp;&emsp;&emsp;OP contains <textarea rows="1" cols="20" name="uip_tracker.auto_open_kwd"></textarea><br>'+
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
//&emsp;<textarea rows="1" cols="40" name="overwrite_site2_json_str"></textarea><br>\
//&emsp;<input type="button" value="JSON"><br>\
//&emsp;<textarea rows="1" cols="40" name="overwrite_site2_eval_str"></textarea><br>\
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
//&emsp;&emsp;&emsp; Style:<textarea rows="1" cols="40" name="catalog_triage_str"></textarea><br>\
//<!-- &emsp;<input type="checkbox" name="catalog_enable_cross_board"> Enable cross-board catalog<br> -->\
//<!-- &emsp;<input type="checkbox" name="catalog_enable_cross_domain"> Enable cross-domain catalog<br> -->\
//<!-- &emsp;&emsp; Cache working in <textarea rows="1" cols="20" name="catalog_sw_domain"></textarea><br> -->'+
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
        pref_apply_prep(false);
//        if (brwsr.ff) pn7.draggable = false;
        cnst.bottom_top(pn7);
      }
      var fm = pn7_1.getElementsByTagName('input');
      for (var i=0;i<fm.length;i++) {
        if (fm[i].type=='button') {
          if (make) fm[i].addEventListener('click', button_action, false);
          else fm[i].removeEventListener('click', button_action, false);
        }
      }
      if (make) return pn7;
      else {
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
      if (e.newValue==null) return;
      if (e.key==pipe_name && pref.aggregator=='false') {
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
      if (!on && pref.aggregator=='false') {
        window.addEventListener   ('storage', listen_event, false);
        on = true;
      } else if (on && pref.aggregator=='true') {
        window.removeEventListener('storage', listen_event, false);
        on = false;
      }
    }
    setup();
    return setup;
  };
//  })();
  var listener = null;
  if (site.features.listener) listener = make_listener();

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
          if (pref.info_server && page.no()!=site.max_page && brwsr.sw_cache)
            brwsr.sw_cache.setItem(info_raw+'p'+page.no(),JSON.stringify([cnst.get_time(), req.responseText]));
          if (pref.catalog_snoop_refresh && catalog_obj.catalog_func()!=null)
            catalog_obj.catalog_func().catalog_insert(info_raw+'p'+page.no(),JSON.stringify([cnst.get_time(), req.responseText]));
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
        var url = site.make_url(site.board,page.no());
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

    return {
      destroy: function(){
        timer.stop(true);
        timer.destroy();
        return null;
      },
      timer: function(){return timer;},
      page_check4: page_check4
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
//    if (func!=10) document.getElementsByTagName('body')[0].appendChild(pn);
//    pn.draggable = true;
//    pn.addEventListener('dragstart', div_dragstart, false);
////    pn.addEventListener('dragstart', div_dragstart, true);
//    pn.addEventListener('dragend', div_dragend, false);
//    return pn;
//  }
//  function div_destroy(pn,child_of_body){
//    if (child_of_body) document.getElementsByTagName('body')[0].removeChild(pn);
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
    function show_hide(){
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
        document.getElementsByTagName('body')[0].appendChild(pn10);
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
        document.getElementsByTagName('body')[0].removeChild(pn10);
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
//      if (!pn11_on) document.getElementsByTagName('body')[0].appendChild(pn11);
//      else document.getElementsByTagName('body')[0].removeChild(pn11); // can't prevent redirection.
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

  if (window.SharedWorker && (pref.info_server || pref.info_client)) brwsr.sw_cache = (function(){
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
          var echo  = [];\
          var store = {};\
          var funcs = [];\
          var connections = 0;\
          self.addEventListener("connect", function(e){\
            var port = e.ports[0];\
            var no = connections++;\
            var func = function(e){msg_parser(e,port,no)};\
            funcs.push(func);\
            port.addEventListener("message", func, false);\
            port.start();\
            port.postMessage(JSON.stringify(["INFO","Connected: #" + no]));\
            ports.push(port);\
            echo.push(true);\
          }, false);\
          function msg_parser(e,port,no){\
            if (echo[no]) port.postMessage(e.data);\
            var fields = JSON.parse(e.data);\
            if (fields[0]=="ECHO") {\
              if (fields[1]=="ON") echo[no] = true;\
              else echo[no] = false;\
            } else if (fields[0]=="GET") port.postMessage(JSON.stringify(["ACK",fields[1],store[fields[1]]]));\
            else if (fields[0]=="CLOSE") {\
              port.removeEventListener("message", funcs[no], false);\
              ports[no] = null;\
              funcs[no] = null;\
            }\
/*            else if (fields[0]=="SET") store[fields[1]]=fields[2];*/\
            else if (fields[0]=="SET") {\
              var old_val = store[fields[1]];\
              if (old_val!=fields[2]) {\
                var msg = JSON.stringify(["EVENT",fields[1],fields[2]]);\
                for (var i=0;i<ports.length;i++)\
                  if (i==no) store[fields[1]]=fields[2];\
                  else if (ports[i]!=null) ports[i].postMessage(msg);\
              }\
            } else if (fields[0]=="STAT") {\
              var live = 0;\
              for (var i=0;i<ports.length;i++) if (ports[i]) live++;\
              var count = 0;\
              for (var i in store) count++;\
              var msg = JSON.stringify(["STAT_ACK","Connected: "+live+"/"+connections+", Stored: "+count]);\
              port.postMessage(msg);\
            }\
          }\
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
      console.log(new Date().toLocaleTimeString() + ', Worker said : ' + e.data.substr(0,80));
      if (!sw_alive) {
        worker.port.postMessage(JSON.stringify(['STAT']));
        if (!pref.debug_mode) worker.port.postMessage(JSON.stringify(['ECHO','OFF']));
//        worker.port.postMessage(JSON.stringify(['ECHO','ON']));
//        worker.port.postMessage(JSON.stringify(['ECHO','OFF']));
      }
      sw_alive = true;
      if (!pref.debug_mode) worker.port.removeEventListener('message', sw_out, false);
      window.addEventListener('beforeunload',
        function(){
          worker.port.postMessage(JSON.stringify(['CLOSE']));
          worker.port.close();
        }, false);
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
    function sw_tryget(e){
      var fields = JSON.parse(e.data);
      if (fields[0]=="ACK") {
        clearTimeout(tryget_ids[fields[1]]);
        callbacks[fields[1]](fields[1],fields[2]); // callback with value.
      } else if (fields[0]=="EVENT") {
        if (pref.info_client && fields[1].search(info_raw)!=-1 && fields[1].substr(info_raw.length,1)=='p') {
          var page_no = fields[1].substr(info_raw.length+1);
          var timer = (timer_obj)? timer_obj.timer() : null;
          if (timer!=null) {
            var value = JSON.parse(fields[2]);
            timer.page_check4(value[0], page_no, new DOMParser().parseFromString(value[1],'text/html'));
          }
        }
        if (pref.info_client && catalog_obj && catalog_obj.catalog_func()!=null && pref.catalog_snoop_refresh)
          catalog_obj.catalog_func().catalog_insert(fields[1],fields[2]);
      }
    }
    function tryget_timeout(key){ // timeout is sequential always.
      callbacks[key](key,null); // callback with null.
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
      trygetItem: function(key,callback){
        callbacks[key] = callback;
        tryget_ids[key] = setTimeout(function(){tryget_timeout(key);},2000); // timeout 2sec
        worker.port.postMessage(JSON.stringify(['GET',key]));
      },
      addEventListener: function(){
      }
    }
  })();

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

