var columnWidth = 3 ;     // 3 Columns per page
var refreshRate = 0 ;     // Autorefresh is off
var layout = false ;      // Layout not set by default
var heartbeat = false ;   // Updater reference
var contextMenu = false ; // Common context menu

function initLoop(  initValues  ){
  Ext.onReady(  function(){
    heartbeat = new Ext.util.TaskRunner() ;
    initAjax() ;
    var mainContent = mainPanel( initValues ) ;
    renderInMainViewport( [ mainContent ] ) ;
  });
}
function mainPanel( initValues  ){
  heartbeat = new Ext.util.TaskRunner() ; // !!!!! Check it !!!!!
  contextMenu = new Ext.menu.Menu() ;
  if( initValues && initValues.column ){
    columnWidth = initValues.column ;
  }
  var current = {
    disabled          : true
    ,disabledClass    : 'my-disabled'
    ,id               : 'currentID'
    ,text             : 'Current Layout: <b>' + layout + '</b>'
  };
  var timeStamp = new Ext.Toolbar.Button({
    disabled          : true
    ,disabledClass    : 'my-disabled'
    ,hidden           : true
    ,id               : 'timeStamp'
    ,text             : 'Updated: '
  }); 
  var add = new Ext.Toolbar.Button({
    cls               : 'x-btn-text-icon'
    ,handler          : function(){ addPanelForm()  }
    ,iconCls          : 'Add'
    ,id               : 'addButton'
    ,tooltip          : 'Click to add an image by providing a valid URL'
    ,text             : 'Add'
  });
  var set = new Ext.Toolbar.Button({
    cls               : 'x-btn-text-icon'
    ,iconCls          : 'Save'
    ,id               : 'setLayoutButton'
    ,menu             : createMenu( 'set' , initValues  )
    ,tooltip          : 'Click to save or share current layout'
    ,text             : 'Save'
  });
  var get = new Ext.Toolbar.Button({
    cls               : 'x-btn-text-icon'
    ,iconCls          : 'Load'
    ,id               : 'getLayoutButton'
    ,menu             : createMenu( 'get' , initValues  )
    ,tooltip          : 'Click to open yours or others layout'
    ,text             : 'Open'
  });
  var mng = new Ext.Toolbar.Button({
    cls               : 'x-btn-text-icon'
    ,handler          : manager
    ,iconCls          : 'Act'
    ,id               : 'mngLayoutButton'
    ,tooltip          : 'Click to set permissions or delete your layouts'
    ,text             : 'Manage'
  });
  var del = new Ext.Toolbar.Button({
    cls               : 'x-btn-text-icon'
    ,handler          : function(){ deleteLayout() }
    ,iconCls          : 'Delete'
    ,id               : 'deleteLayoutButton'
    ,tooltip          : 'Click to remove current layout and load previous one'
    ,text             : 'Delete'
  });
  var column = new Ext.Toolbar.Button({
    cls               : 'x-btn-text-icon'
    ,iconCls          : 'columnSplitButton'
    ,id               : 'columnButton'
    ,menu             : createMenu( 'column' )
    ,text             : 'Columns'
    ,tooltip          : 'Click to change number of columns'
  });
  var refresh = new Ext.Toolbar.Button({
    cls               : 'x-btn-text-icon'
    ,handler          : function(){ refreshCycle() }
    ,iconCls          : 'Refresh'
    ,id               : 'refreshButton'
    ,text             : 'Refresh'
    ,tooltip          : 'Click the button for manual refresh'
  });
  var auto = new Ext.Toolbar.Button({
    cls               : 'x-btn-text'
    ,id               : 'autoButton'
    ,menu             : createMenu( 'auto' )
    ,text             : 'Disabled'
    ,tooltip          : 'Click to set the time for autorefresh'
  });
  auto.on(  'menuhide'  , function( button  , menu  ){
    var length = menu.items.getCount();
    for(  var i = 0; i < length; i++  ){
      if( menu.items.items[ i ].checked ){
        button.setText( menu.items.items[ i ].text  );
      }
    }
  });
  var panel = new Ext.Panel({
    autoScroll        : true
    ,bbar             : [ 
                          refresh 
                          , '-' 
                          , 'Auto:' 
                          , auto  
                          , timeStamp 
                          , '->' 
                          , column
                        ]
    ,bodyStyle        : 'padding:5px;'
    ,defaults         : { bodyStyle : 'padding:5px' }
    ,id               : 'mainConteiner'
    ,items            : [ newLayout() ]
    ,layout           : 'column'
    ,margins          : '2 0 2 0'
    ,monitorResize    : true
    ,region           : 'center'
    ,tbar             : [ 
                          current
                          , '->'
                          , add
                          , '-'
                          , get
                          , set
//                          , mng
                          , del
                        ]
  });
  panel.on( 'render'  , function(){
    var test = false ;
    if( initValues && initValues.history && Ext.isArray( initValues.history ) ){
      test = initValues.history[ 0 ] ;
    }
    if( window.location.hash  ){
      var obj = window.location.hash.split( '#' ) ;
      if( obj.length == 2 ){
        obj = Ext.urlDecode( obj[ 1 ]) ;
      }
      if( obj && obj.layout && obj.owner && obj.group ){
        if( ! test ){
          test = new Object() ;
        }
        test.name = obj.layout ;
        test.user = obj.owner ;
        test.group = obj.group ;
      }
    }
    if( initValues && initValues.layout ){
      var l = initValues.layout ;
      if( test.name == l.name && test.user == l.user && test.group == l.group ){
        return redoLayout( initValues.layout ) ;
      }
    }
    if( ! test ){
      return ;
    }
    test[ 'loadLayout' ] = true ;
    ajax({
      mask          : true
      ,params       : test
      ,success      : actionSuccess
    }) ;
  });
  return panel
}
function manager(){
  var store = new Ext.data.JsonStore({
    autoLoad          : true
    ,baseParams       : { 'getAvailbleLayouts' : true , 'userOnly' : true }
    ,fields           : [ 'name' , 'group' , 'All' ]
    ,idProperty       : 'name'
    ,root             : 'result'
    ,url              : 'action'
  }) ;
  store.on( 'datachanged' , function( store ){
    submit.enable() ;  
  }) ;
  var columns = [{
    align             : 'left'
    ,dataIndex        : 'name'
    ,editable         : false
    ,id               : 'sl1'
    ,sortable         : false
  },{
    align             : 'left'
    ,css              : 'cursor:pointer;cursor:hand;'
    ,dataIndex        : 'group'
    ,editable         : false
    ,id               : 'sl2'
    ,sortable         : false
  },{
    align             : 'left'
    ,css              : 'cursor:pointer;cursor:hand;'
    ,dataIndex        : 'All'
    ,editable         : false
    ,id               : 'sl3'
    ,sortable         : false
  }] ;
  var grid = new Ext.grid.GridPanel({
    anchor            : '-15'
    ,autoScroll       : true
    ,border           : false
    ,columns          : columns
    ,enableHdMenu     : false
    ,hideHeaders      : true
    ,loadMask         : true
    ,split            : true    
    ,store            : store
    ,stripeRows       : true
    ,width            : 200
    ,viewConfig       : { forceFit  : true , scrollOffset : 1 }
  });
  grid.addListener( 'cellclick' , function( table , rowIndex , columnIndex ){
    var record = table.getStore().getAt( rowIndex ) ;
    var fieldName = table.getColumnModel().getDataIndex( 0 ) ;
  });
  var win = formWindow({
    icon              : 'Load'
    ,title            : 'Load layout'
  }) ;
  win.add( grid ) ;
  var submit = win.buttons[ 0 ] ;
  submit.setText( 'Save changes' ) ;
  submit.setIconClass( 'Save' ) ;
  submit.setHandler( function(){
//    saveChanges() ;
  }) ;
  submit.disable() ;
  var reset = win.buttons[ 1 ] ;
  reset.setHandler( function(){ store.rejectChanges() }) ;
  win.show() ;
}
function actionSuccess( response , options ){
  if( ! options || ! options.params ){
    return false ;
  }
  var kind = false ;
  if( options.params.saveLayout ){
    kind = 'save' ;
  }else if( options.params.loadLayout ){
    kind = 'load' ;
  }
  if( ! kind ){
    return false ;
  }
  var response = Ext.util.JSON.decode( response.responseText ) ;
  if( response.success != 'true' ){
    return showError( response.error ) ;
  }
  if( kind == 'save' ){
    return true ;
  }
  redoLayout( response[ 'result' ] ) ;
  var mainPanel = Ext.getCmp( 'mainConteiner' );
  if( mainPanel ){
    mainPanel.doLayout() ;
  }
  return true ;
}
function loadLayout( layout , win ){
  if( ! layout ){
    return showError( 'loadLayout function: Layout object is absent' ) ;
  }
  if( ! layout.name ){
    return showError( 'loadLayout function: Layout name is absent' ) ;
  }
  if( ! layout.user ){
    return showError( 'loadLayout function: Owner username is absent' ) ;
  }
  if( ! layout.group ){
    return showError( 'loadLayout function: Owner group is absent' ) ;
  }
  var params = new Object() ;
  params[ 'loadLayout' ] = true ;
  params[ 'name' ] = layout.name ;
  params[ 'user' ] = layout.user ;
  params[ 'group' ] = layout.group ;
  var title = 'Load Layout' ;
  var msg = 'Load the layout: ' + layout.name + ' ?';
  Ext.Msg.confirm( title , msg , function( btn ){
    if( btn == 'yes' ){
      ajax({
        mask          : true
        ,params       : params
        ,success      : actionSuccess
      }) ;
      if( win ){
        win.close() ;
      }
    }
  });
  return true ;
}
function saveLayout( name , perm ){
  var params = gatherInfo() ;
  params[ 'saveLayout' ] = true ;
  params[ 'name' ] = name ;
  var permissions = 'USER' ;
  if( perm.group ){
    permissions = permissions + ',GROUP' ;
  }
  if( perm.all ){
    permissions = permissions + ',ALL' ;
  }
  if( perm == 'SAME' ){
    params[ 'permissions' ] = perm ;
  }else{
    params[ 'permissions' ] = permissions ;
  }
  var title = 'Save Layout' ;
  var welcome = Ext.getCmp( 'welcomeMessage' ) ;
  if(welcome){
    return showError( 'This is the default layout and can not be saved' ) ;
  }
  var msg = 'Save current layout to: ' + name + ' ?';
  Ext.Msg.confirm( title , msg , function( btn ){
    if( btn == 'yes' ){
      ajax({
        mask          : true
        ,params       : params
        ,success      : actionSuccess
      }) ;
    }
  });
  return true ;
}
function load( name ){
  if( name ){
    return loadLayout( name ) ;
  }
  var store = new Ext.data.JsonStore({
    autoLoad          : true
    ,baseParams       : { 'getAvailbleLayouts' : true }
    ,fields           : [ 'name' , 'user' , 'group' ]
    ,idProperty       : 'name'
    ,root             : 'result'
    ,url              : 'action'
  }) ;
  store.on( 'load' , function( store, record ){
    if( store.reader.jsonData ){
      userStore.loadData( store.reader.jsonData ) ;
    }
  }) ;
  var columns = [{
    align             : 'left'
    ,css              : 'cursor:pointer;cursor:hand;'
    ,dataIndex        : 'name'
    ,editable         : false
    ,id               : 'sl1'
    ,sortable         : false
  },{
    align             : 'left'
    ,css              : 'cursor:pointer;cursor:hand;'
    ,dataIndex        : 'user'
    ,editable         : false
    ,id               : 'sl2'
    ,sortable         : false
  },{
    align             : 'left'
    ,css              : 'cursor:pointer;cursor:hand;'
    ,dataIndex        : 'group'
    ,editable         : false
    ,id               : 'sl3'
    ,sortable         : false
  }] ;
  var userStore = new Ext.data.JsonStore({
    fields            : [ { name : 'user' } ]
    ,root             : 'users'
  }) ;
  var user = new dropdownMenu({
    combo             : false
    ,displayField     : 'user'
    ,emptyText        : 'Select Owner'
    ,name             : 'selectOwner'
    ,maxLength        : 20
    ,store            : userStore
    ,width            : 80
  }) ;
  user.addListener( 'collapse' , function( combo ){
    var value = combo.getRawValue() ;
    store.filter( 'user' , value ) ;
  }) ;
  var reset = new Ext.Button({
    cls               : 'x-btn-icon'
    ,ctCls            : 'paddingButton'
    ,handler          : function(){
                          user.reset() ;
                          store.clearFilter() ;
                        }
    ,icon             : gURLRoot + '/images/iface/reset.gif'
    ,minWidth         : '25'
    ,tooltip          : 'Resets list of users menu'
  }) ;
  var tbar = new Ext.Toolbar({
    items             : [
                          user
                          , reset
                        ]
  }) ;
  var grid = new Ext.grid.GridPanel({
    anchor            : '-15'
    ,autoScroll       : true
    ,border           : false
    ,columns          : columns
    ,enableHdMenu     : false
    ,hideHeaders      : true
    ,loadMask         : true
    ,split            : true    
    ,store            : store
    ,stripeRows       : true
    ,tbar             : tbar
    ,width            : 200
    ,viewConfig       : { forceFit  : true , scrollOffset : 1 }
  });
  grid.addListener( 'cellclick' , function( table , rowIndex , columnIndex ){
    var record = table.getStore().getAt( rowIndex ) ;
    var name = record.get( table.getColumnModel().getDataIndex( 0 ) ) ;
    var user = record.get( table.getColumnModel().getDataIndex( 1 ) ) ;
    var group = record.get( table.getColumnModel().getDataIndex( 2 ) ) ;
    loadLayout({
      group           : group
      ,name           : name
      ,user           : user
    }, win ) ;
  });
  grid.on( 'resize' , function(){
    toolbarElementsAutoresize( tbar , [ user ] ) ;
  }) ;
  var win = formWindow({
    icon              : 'Load'
    ,title            : 'Load layout'
  }) ;
  win.add( grid ) ;
  var submit = win.buttons[ 0 ] ;
  submit.setText( 'Refresh' ) ;
  submit.setIconClass( 'Refresh' ) ;
  submit.setHandler( function(){
    store.reload()
  }) ;
  win.buttons[ 1 ].hide() ; // Hiding reset button
  win.show() ;
}
function save( name ){
  if( name ){
    return saveLayout( name , 'SAME' ) ;
  }
  var params = gatherInfo() ;
  var welcome = Ext.getCmp('welcomeMessage') ;
  if(welcome){
    return showError( 'This is the default layout and can not be saved' ) ;
  }
  var store = new Ext.data.JsonStore({
    autoLoad          : true
    ,baseParams       : { 'getUserLayouts' : true }
    ,fields           : [ 'name' ]
    ,idProperty       : 'name'
    ,root             : 'result'
    ,url              : 'action'
  }) ;
  var columns = [{
    align             : 'left'
    ,css              : 'cursor:pointer;cursor:hand;'
    ,dataIndex        : 'name'
    ,editable         : false
    ,id               : 'sl1'
    ,sortable         : false
  }] ;
  var shareStore = new Ext.data.SimpleStore({
    data              : [ [ 'Everyone' ] , [ 'Group' ] ]
    ,fields           : [ 'value' ]
  });
  var share = new dropdownMenu({
    combo             : true
    ,name             : 'shareWith'
    ,maxLength        : 20
    ,selectOnFocus    : false
    ,store            : shareStore
    ,width            : 80
  }) ;
  var bbar = new Ext.Toolbar({
    items             : [
                          'Share profile with: '
                          , share
                        ]
  }) ;
  var regexp = new RegExp( /^[0-9a-zA-Z]+$/ ) ;
  var regmsg = 'Letters and numbers only are allowed' ;
  var save = genericID( 'save' , '' , regexp , regmsg , 'None' ) ;
  save.setValue( layout ) ;
  var tbar = new Ext.Toolbar({
    items             : [
                          'Save as:'
                          , save
                        ]
  });
  var grid = new Ext.grid.GridPanel({
    anchor            : '-15'
    ,autoScroll       : true
    ,bbar             : bbar
    ,border           : false
    ,columns          : columns
    ,enableHdMenu     : false
    ,hideHeaders      : true
    ,loadMask         : true
    ,split            : true    
    ,store            : store
    ,stripeRows       : true
    ,tbar             : tbar
    ,width            : 200
    ,viewConfig       : { forceFit  : true , scrollOffset : 1 }
  });
  grid.on({
    'resize'          : function(){
                          toolbarElementsAutoresize( tbar , [ save , chkBox ] ) ;
                          toolbarElementsAutoresize( bbar , [ share ] ) ;
                        }
  }) ;
  var win = formWindow({
    icon              : 'Save'
    ,title            : 'Save as new layout'
  }) ;
  win.add( grid ) ;
  var submit = win.buttons[ 0 ] ;
  submit.setText( 'Save' ) ;
  submit.setIconClass( 'Save' ) ;
  submit.setHandler( function(){
    var name = save.getValue() ;
    var perm = share.getRealValue() ;
    var group = ( perm.indexOf( 'Group' ) > -1 ) ? true : false ;
    var all = ( perm.indexOf( 'Everyone' ) > -1 ) ? true : false ;
    saveLayout( name , { group : group , all : all } ) ;
  }) ;
  win.buttons[ 1 ].hide() ; // Hiding reset button
  win.show() ;
}
function addPanel( init ){
  var url = false ;
  try{
    url = init[ 'url' ] ;
  }catch(e){
    return showError( e.name + ': ' + e.message ) ;
  }
  if( ! url ){
    return showError( 'The Path input field is empty or invalid' ) ;
  }
  try{
    var mainPanel = new Ext.getCmp( 'mainConteiner' ) ;
    var width = 0;
    if( columnWidth > 0 ){
      width = ( mainPanel.getInnerWidth() - 30 ) / columnWidth ;
    }
    width = Math.round( width ) ;
    var tmpPanel = createPanel( url ) ;
    tmpPanel.setWidth( width ) ;
    mainPanel.add( tmpPanel ) ;
    mainPanel.doLayout() ;
    enableButtons( true ) ;
  }catch(e){
    return showError( e.name + ': ' + e.message ) ;
  }
}
function addPanelForm(){
  var html = 'In the Path text field you can put any URL of an image.<br>To ' ;
  html = html + 'delete the image simple do right mouse click over it and ' ;
  html = html + 'select \'remove\' action' ;
  var regexp = new RegExp( /\b((?:[a-z][\w-]+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s(<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))/i );
  var url = genericID('url','Path',regexp,'Only a valid URL is allowed','None');
  var label = new Ext.form.Label({
    anchor            : '100%'
    ,fieldLabel       : 'Tip'
    ,html             : html
  }) ;
  var panel = new Ext.FormPanel({
    bodyStyle         : 'padding: 5px'
    ,border           : false
    ,buttonAlign      : 'center'
    ,items            : [ url , label ]
    ,labelWidth       : 50
  }) ;
  var win = formWindow({
    title             : 'Add new image to current layout'
  }) ;
  win.add( panel ) ;
  var submit = win.buttons[ 0 ] ;
  submit.setText( 'Add panel' ) ;
  submit.on({
    'click'           : function(){
                          addPanel( panel.form.getValues( false ) ) ;
                          win.close() ;
                        }
  }) ;
  var reset = win.buttons[ 1 ] ;
  reset.on({
    'click'           : function(){ panel.form.reset() }
  }) ;
  win.show() ;
}
function enableButtons( enable ){
  var buttonsID = [ 
                    'autoButton'
                    , 'deleteLayoutButton'
                    , 'columnButton'
                    , 'refreshButton'
                    , 'setLayoutButton'
                  ] ;
  for( var i = 0 ; i < buttonsID.length ; i++ ){
    var button = Ext.getCmp( buttonsID[ i ] ) ;
    if( ! button ){
      continue
    }
    if( enable ){
      button.enable() ;
    }else{
      button.disable() ;
    }
  }
}
function setRefresh( time ){
  if( time == 0 ){
    heartbeat.stopAll();
  }else{
    heartbeat.start({
      run             : refreshCycle
      ,interval       : time
    });
  }
}
function newLayout(){
  var html = '<br><center><h1>Information Presenter</h1></center><br><p>With this page you can build your own collection of monitoring tools.';
  html = html + 'Currently only plots can be presented in a grid like layout. The layouts can be saved in the User Profile and recalled back.';
  html = html + ' You can define as many layouts as you need.</p><br>';
  html = html + '<h1>Managing layouts</h1><br><h3>Adding image</h3><p>To start with, press <b>Add</b> button and enter an image URL in the <i>Path</i> field.';
  html = html + 'You can enter any URL of a plot not only the DIRAC accounting plots. The image will be added to the layout.';
  html = html + ' The number of columns of the layout grid can be chosen with the <b>Columns</b> selector.</p>';
  html = html + '<br><h3>Removing image</h3><p>To remove an image do mouse right click on it and select <i>Remove</i> in the drop-down menu.</p>';
  html = html + '<br><h3>Saving layout</h3><p>You can always save the current layout on the server side by clicking ';
  html = html + '<b>Save</b> -&gt; <b>Save as new</b> button.</p><br><h3>Loading layout</h3>';
  html = html + '<p>If you want to load layout or to discard the changes, just click the <b>Load</b> button and select layout to restore</p>';
  html = html + '<br><h3>Exporting and importing layouts</h3><p>If you want to share your layout with others, you can choose ';
  html = html + '<b>Actions</b> -&gt; <b>Export</b> menu item and copy the layout description from a pop-up panel as a long string.';
  html = html + ' This string can now be sent to other users. To use it, choose <b>Actions</b> -&gt; <b>Import</b>';
  html = html + ' and paste the layout description.</p><center>';

  html = html + '<object width="425" height="344"><param name="movie" value="http://www.youtube.com/v/TSY4y-Qr_LM&hl=en&fs=1"></param><param name="allowFullScreen" value="true"></param><param name="allowscriptaccess" value="always"></param><embed src="http://www.youtube.com/v/TSY4y-Qr_LM&hl=en&fs=1"type="application/x-shockwave-flash" allowscriptaccess="always" allowfullscreen="true" width="425" height="344"></embed></object>';
  html = html + '</center>';
  var message = {
    anchor            : '100%'
    ,columnWidth      : .99
    ,fieldLabel       : 'Tip'
    ,html             : html
    ,id               : 'welcomeMessage'
    ,xtype            : 'label'
  };
  return message
}
function setChk( value ){
  if( value == columnWidth ){
    return true
  }else if( value == refreshRate ){
    return true
  }else{
    return false
  }
}
function createColumnMenuItem( num ){
  var width = 100 ;
  if( num > 0 ){
    width = Math.floor( 100 / num ) ;
  }
  width = width - 1 ;
  width = '.' + width ;
  var item = new Ext.menu.CheckItem({
    checked           : setChk( num )
    ,checkHandler     : function(){
                          columnWidth = num ;
                          setColumnWidth( width ) ;
                        }
    ,group            : 'column'
    ,text             : ( num > 1 ) ? num + ' Columns' : num + ' Column'
  });
  return item
}
function createAutoMenuItem( num , text ){
  var item = new Ext.menu.CheckItem({
    checked           : setChk( num )
    ,checkHandler     : function(){ setRefresh( num ) }
    ,group            : 'refresh'
    ,text             : text
  });
  return item
}
function createLayoutMenuItem( layout , mode ){
  if( ! layout.name ){
    return showError( 'createLayoutMenuItem function: Layout name is absent' ) ;
  }
  var text = layout.name ;
  if( mode == 'get' ){
    var handler = function(){ load( layout ) } ;
    if( layout.user && layout.group ){
      text = text + ' by ' + layout.user + '@' + layout.group ;
    }
  }else{
    var handler = function(){ save( layout.name ) } ;
    if( layout.group ){
      text = text + ' @' + layout.group ;
    }
  }
  var item = new Ext.menu.Item({
    handler           : handler
    ,text             : text
  });
  return item
}
function createMenu( mode , init ){
  var menu = new Ext.menu.Menu() ;
  var history = false ;
  if( init && init.history && Ext.isArray( init.history ) ){
    if( init.history.length > 0 ){
      history = init.history ;
    }
  }
  if( mode == 'set' ){
    var saveNew = new Ext.menu.Item({
      handler         : function(){ save() }
      ,icon           : gURLRoot + '/images/iface/save.gif'
      ,text           : 'Save as new layout'
    });
    menu.addItem( saveNew ) ;
    if( history ){
      menu.addItem( new Ext.menu.Separator() ) ;
    }
  }else if( mode == 'get' ){
    var open = new Ext.menu.Item({
      handler         : function(){ load() }
      ,icon           : gURLRoot + '/images/iface/export.gif'
      ,text           : 'Load a new layout'
    });
    menu.addItem( open ) ;
    if( history ){
      menu.addItem( new Ext.menu.Separator() ) ;
    }
  }else if( mode == 'column' ){
    for( var i = 1 ; i < 6 ; i++ ){
      menu.addItem( createColumnMenuItem( i ) ) ;
    }
  }else if( mode == 'auto' ){
// TODO Get init values from the CS  
    var initObj = {
      0               : 'Disabled'
      ,900000         : '15 Minutes'
      ,1800000        : '30 Minutes'
      ,3600000        : 'One Hour'
      ,86400000       : 'One Day'
    }
    for ( var i in initObj ){
      menu.addItem( createAutoMenuItem( i , initObj[ i ] ) ) ;
    }
  }else{
    return false ;
  }
  if( history ){
    var len = history.length ;
    for( var i = 0 ; i < len ; i++ ){
      menu.addItem( createLayoutMenuItem( history[ i ] , mode ) ) ;
    }
  }
  return menu ;
}
function refreshCycle(){
  try{
    var mainPanel = Ext.getCmp( 'mainConteiner' ) ;
    var length = mainPanel.items.getCount() ;
    for( var i = 0 ; i < length ; i++ ){
      var item = mainPanel.getComponent( i ) ;
      if( item.id == 'welcomeMessage' ){
        continue ;
      }
      var tmpSrc = item.autoEl.src ;
      if( tmpSrc.search( /&dummythingforrefresh/i ) > 0 ){
        tmpSrc = tmpSrc.split( '&dummythingforrefresh' )[ 0 ] ;
      }
      tmpSrc = tmpSrc + '&dummythingforrefresh=' + Ext.id() ;
      tmpSrc = tmpSrc + '_' + Math.floor( Math.random() * 101 );
      var tmpItem = createPanel( tmpSrc ) ;
      mainPanel.remove( i ) ;
      mainPanel.insert( i , tmpItem ) ;
    }
    mainPanel.doLayout() ;
    updateTimestamp() ;
  }catch(e){
    return showError( e.name + ': ' + e.message ) ;
  }
}
function setColumnWidth( width ){
  try{
    var mainPanel = Ext.getCmp( 'mainConteiner' ) ;
    var length = mainPanel.items.getCount() ;
    for( var i = 0 ; i < length ; i++ ){
      var item = mainPanel.getComponent( i ) ;
      if( item.id == 'welcomeMessage' ){
        continue ;
      }
      item.columnWidth = width ;
    }
    mainPanel.doLayout() ;
  }catch(e){
    return showError( e.name + ': ' + e.message ) ;
  }
}
function updateTimestamp(){
  var stamp = Ext.getCmp( 'timeStamp' ) ;
  if( stamp ){
    var d = new Date() ;
    var hh = d.getHours() ;
    if(hh < 10){
      hh = '0' + hh ;
    }
    var mm = d.getMinutes() ;
    if(mm < 10){
      mm = '0' + mm ;
    }
    stamp.setText( 'Updated: ' + hh + ":" + mm) ;
    stamp.show() ;
  }
}
function gatherInfo(){
  var url = '' ;
  try{
    var mainPanel = Ext.getCmp( 'mainConteiner' ) ;
    var length = mainPanel.items.getCount() ;
    for( var i = 0 ; i < length ; i++ ){
      if( mainPanel.getComponent( i ).id == 'welcomeMessage'){
        continue ;
      }
      var tmpSrc = mainPanel.getComponent( i ).autoEl.src ;
      if( tmpSrc.search(/&dummythingforrefresh/i) > 0 ){
        tmpSrc = tmpSrc.split( '&dummythingforrefresh' )[ 0 ] ;
      }
      if( tmpSrc.slice( -1 ) == '?' ){
        tmpSrc = tmpSrc.slice( 0 , -1 ) ;
      }
      url = url + tmpSrc + ';' ;
    }
  }catch(e){
    return showError( e.name + ': ' + e.message ) ;
  }
  if( url ){
    url = url.replace(/&/g,'[ampersand]') ;
  }
  return { 'columns' : columnWidth , 'refresh' : refreshRate , 'url' : url } ;  
}
function redoLayout( layout ){
  if( !layout ){
    return showError( 'Function redoLayout expects at least one argument' ) ;
  }
  if( !layout.name ){
    return showError( 'Function redoLayout: layout object has no name' ) ;
  }
  if( !layout.url ){
    return showError( 'Function redoLayout: layout object should have url property' ) ;
  }
  columnWidth = layout[ 'columns' ] / 1 ;
  Ext.num( columnWidth , -1 ) ; 
  if( columnWidth == -1 ){
    showError( 'Function redoLayout: failed to covert columns to a number' ) ;
  }
  refreshRate = layout[ 'refresh' ] / 1 ;
  refreshRate = Ext.num( refreshRate , -1 ) ;
  if( refreshRate == -1 ){
    showError( 'Function redoLayout: failed to covert refreshRate to a number' ) ;
  }
  var hash = Ext.urlEncode({
    group             : layout.group
    ,layout           : layout.name
    ,owner            : layout.user
  }) ;
  window.location.hash = hash ;
  var current = Ext.getCmp( 'currentID' ) ;
  if( current ){
    current.setText( 'Current Layout: <b>' + layout.name + '</b>' ) ;
    document.title = layout.name ;
  }
  updateTimestamp() ;
  var plotSrc = layout.url ;
  plotSrc = plotSrc.replace( /\[ampersand\]/g , '&' ) ;
  var plots = plotSrc.split( ';' ) ;
  for( var i = 0 ; i < plots.length ; i++ ){
    if( plots[ i ].search( /&dummythingforrefresh/i ) > 0 ){
      plots[ i ] = plots[ i ].split( '&dummythingforrefresh' )[ 0 ] ;
    }
    if( plots[ i ].slice( -1 ) == '?' ){
      plots[ i ] = plots[ i ].slice( 0 , -1 ) ;
    }
  }
  var mainPanel = Ext.getCmp( 'mainConteiner' );
  if( !mainPanel ){
    return showError( 'Function redoLayout: Failed to get main container' ) ;
  }
  if( !plots ){
    return true ;
  }
  var length = mainPanel.items.getCount() - 1 ;
  for( var i = length ; i >= 0 ; i-- ){
    var tmp = mainPanel.getComponent( i ) ;
    mainPanel.remove( tmp , true ) ;
  }
  if( plots.length > 0 ){
    for( var i = 0 ; i < plots.length ; i++ ){
      if( plots[ i ].length < 1 ){
        continue ;
      }
      mainPanel.add( createPanel( plots[ i ] ) ) ;
    }
  }else{
    mainPanel.add( newLayout() ) ;
  }

//  enableButtons( false ) ;
}
////////////////////////////////////////////////////////////////////////////////
function fullSize( link ){
  var html = '<img src="' + link + '" />' ;
  var win = new Ext.Window({
    collapsible:true,
    constrain:true,
    constrainHeader:true,
    html:html,
    layout:'fit',
    minHeight:200,
    minWidth:320,
    title:'Actual size'
  });
  win.show();
}
function createPanel(img){
  var welcome = Ext.getCmp('welcomeMessage');
  if(welcome){
    var mainPanel = Ext.getCmp('mainConteiner');
    mainPanel.remove(welcome);
  }
  var boxID = Ext.id();
  var width = 100 / columnWidth ;
  width = '.' + Math.round( width ) ;
  var box = new Ext.BoxComponent({
    autoEl:{
      tag:'img',
      style:'cursor:pointer;cursor:hand;',
      src:img
    },
    columnWidth:width,
    cls:'pointer',
    id:boxID
  });
  box.on('render',function(){
    box.el.on('click', function(evt,div,x,y,z) {
      fullSize(img);
    });
    box.el.on('contextmenu', function(evt,div,x,y,z) {
      evt.stopEvent();
      contextMenu.removeAll();
      contextMenu.add({
          disabled:true,
          handler:function(){
            return
          },
          icon:gURLRoot + '/images/iface/edit.gif',
          text:'Edit'
        },{
          handler:function(){
            var mainPanel = Ext.getCmp('mainConteiner');
            mainPanel.remove(box);
            var current = Ext.getCmp('currentID');
            if(current){
              current.setText('Current Layout: <b>' + layout + '*</b>');
            }
          },
          icon:gURLRoot + '/images/iface/close.gif',
          text:'Remove'
        },{
          handler:function(){
            window.open(img)
          },
          icon:gURLRoot + '/images/iface/new-window.gif',
          text:'Open in new window'
        },{
          handler:function(){
            changeURL(boxID,img);
          },
          icon:gURLRoot + '/images/iface/edit.gif',
          text:'Change URL'
        },{
          handler:function(){
            if(img.search(/&dummythingforrefresh/i) > 0){
              img = img.split('&dummythingforrefresh')[0];
            }
            if( img.slice( -1 ) == '?' ){
              img = img.slice( 0 , -1 ) ;
            }
            Ext.Msg.alert('Show URL',img);
          },
          icon:gURLRoot + '/images/iface/url.gif',
          text:'Show URL'
        });
      contextMenu.showAt(evt.xy);
    });
  });
  return box
}
function changeURL(id,url){
  var winID = Ext.id();
  var pathID = Ext.id();
  var changeValue = ''
  if((url)||(url != null)||(url != '')){
    changeValue = url;
  }
  var change = new Ext.Button({
    cls:"x-btn-text-icon",
    handler:function(){
      try{
        var pathField = Ext.getCmp(pathID);
        var path = pathField.getValue();
      }catch(e){
        alert('Error: ' + e.name + ': ' + e.message);
        return
      }
      if((path == null) || (path == '')){
        alert('Textarea is empty, please input url ther')
        return
      }
      try{
        var box = Ext.getCmp(id);
        var mainPanel = Ext.getCmp('mainConteiner');
        var index = mainPanel.items.indexOf(box);
        var newPanel = createPanel(path);
        mainPanel.remove(box);
        mainPanel.insert(index,newPanel);
        mainPanel.doLayout();
        var current = Ext.getCmp('currentID');
        if(current){
          current.setText('Current Layout: <b>' + layout + '*</b>');
        }
      }catch(e){
        alert('Error: ' + e.name + ': ' + e.message);
        return
      }
      var win = Ext.getCmp(winID);
      try{
        win.close();
      }catch(e){
        alert('Error: ' + e.name + ': ' + e.message)
      }
    },
    icon:gURLRoot+'/images/iface/edit.gif',
    minWidth:'150',
    tooltip:'',
    text:'Change URL'
  });
  var cancel = new Ext.Button({
    cls:"x-btn-text-icon",
    handler:function(){
      var win = Ext.getCmp(winID);
      try{
        win.close();
      }catch(e){
        alert('Error: ' + e.name + ': ' + e.message)
      }
    },
    icon:gURLRoot+'/images/iface/reset.gif',
    minWidth:'100',
    tooltip:'Click here to discard changes and close the window',
    text:'Cancel'
  });
  var textarea = new Ext.form.TextArea({
    allowBlank:false,
    anchor:'100%',
    allowBlank:true,
    id:pathID,
    enableKeyEvents:true,
    fieldLabel:'Path',
    selectOnFocus:true,
    value:changeValue
  });
  var win = new Ext.Window({
    buttonAlign:'center',
    buttons:[change,cancel],
    collapsible:true,
    constrain:true,
    constrainHeader:true,
    height:200,
    id:winID,
    items:textarea,
    layout:'fit',
    maximizable:false,
    minHeight:200,
    minWidth:320,
    title:'Create panel',
    width:320
  });
  win.on('resize',function(panel){
    newHeight = panel.getInnerHeight() - 10;
    var path = Ext.getCmp(pathID);
    path.setHeight(newHeight);
  })

  win.show();
}
function AJAXerror(response){
  try{
    gMainLayout.container.unmask();
  }catch(e){}
  try{
    var jsonData = Ext.util.JSON.decode(response);
    if(jsonData['success'] == 'false'){
      alert('Error: ' + jsonData['error']);
      return;
    }else{
      alert('data: ' + jsonData.toSource() + '\nError: Server response has wrong data structure');
      return;
    }
  }catch(e){
    alert('Error: ' + e.name + ': ' + e.message);
    return
  }
}
