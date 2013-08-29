// Copyright 2012 donated to OSGrid.org, see http://forge.opensimulator.org/gf/project/opensimwi/ for details of software licence.
// This code updates the Google Maps module found there from API v2 to API v3, but can be used without the OpenSim Web Interface. It also
// adds new functionality e.g. new hypergrid teleport formats and multiple map centres and/or multiple grids. It also has a draggable marker.

// ########## GRID SPECIFIC VARIABLES, CHANGE THESE AS REQUIRED ##########

var defaultMap = 'world1'; // must be in the lists below, usually the first

// Note that the index labels, e.g. "world1", "world2" etc MUST be the same in each section where they appear,
// so it is recommended that you use this indexing pattern, e.g. add "world3", "world4" etc as necessary.
// Note that you will need local copies of the maptiles or be able to make (soft) links to those in [opensim]/bin/maptiles
// but if you use local copies you will need to update them manually or otherwise. See also the filename setting below.

var xlocations = {
  "world1": 10000, // primary map centre location (x)
  "world2": 5000, // secondary map centre location (x)
  // ... add more lines as required, separated by commas
};

var ylocations = {
  "world1": 10000, // primary map centre location (y)
  "world2": 4999, // secondary map centre location (y)
  // ... add more lines as required, separated by commas, same index labels as above
};

// initial zoom level (make sure 5 <= zoomStart <= 9): for small grids, try 8; for large grids, try 6
zoomStart = 8;

var mapCentreNames = [ // these will appear on the map control buttons, e.g. names of worlds or arbitrary labels
  "Main", // primary map centre name of choice
  "Other", // secondary map centre name of choice
  // ... add more lines as required, separated by commas
];

var copyrightNotices = [ // these may be different for each map, e.g. if for multiple worlds
  "Just testing", // primary copyright notice
  "Still testing", // secondary copyright notice
  // ... add more lines as required, separated by commas
];

var hgdomains = { // these may be different for each map, e.g. if for multiple worlds
  "world1": "opensim.example.com", // primary hypergrid domain
  "world2": "otherworld.example.com", // secondary hypergrid domain
  // .. add more lines as required, separated by commas
};

var hgports = { // these may be different for each map, e.g. if for multiple worlds
  "world1": "8002", // primary hypergrid port
  "world2": "80", // secondary hypergrid port
  // ... add more lines as required, separated by commas
};

// ########## DON'T USUALLY CHANGE THIS ##########
// This setting determines the names of the jpg files. They can be the UUIDs of the regions, or the format 
// used in [opensim]/bin/maptiles or, though not sure you'd want this, UUIDs with dashes removed. This is left 
// in to enable compatibility with the v2 code but it is better to use the proper UUID format with dashes retained.

var filenames = "opensim"; // default is "opensim", otherwise use "uuid" or "uuid-no-dashes"

var showUUID = "false"; // Default is "false", setting to "true" will show the region UUID in the infoWindow

// ########## ONLY SOFTWARE DEVELOPERS BELOW THIS LINE ##########

// ##### VARIABLES #####

// ## Set up variables for grid coordinates ##
var xstart = xlocations[defaultMap];
var ystart = ylocations[defaultMap];

// ## Set up variables for region location ##
var xjump;
var yjump;
var __items;

// ## Set up variables for the map ##
var map;
var latLng = new google.maps.LatLng(11, 11);

var mapTypes = new Array();
var mapTypesCount;

// ## Set up variables for the map overlay ##
var groundOverlayOptions = {map: map, clickable: true, opacity: 1.0};
var layer = new Array();
var layerCount = 0;

// ## Set up options for the marker ##
var markerTitle = "Location";

var marker = new google.maps.Marker({
  position: latLng,
  title: markerTitle,
  map: map,
  draggable: true,
  animation: google.maps.Animation.DROP,
});

var infoWindow = new google.maps.InfoWindow;

var copyrights = {}, id;
var copyrightNode;

// ##### MAP TYPES #####

// ## Set options for the standard map type ##
function plainMapType(name) {
  this.tileSize = new google.maps.Size(192, 192);
  this.maxZoom = 9;
  this.minZoom = 5;
  this.name = name;
  this.alt = "Change map to "+name;
}

// ## Set up div for the standard map type ##
plainMapType.prototype.getTile = function(coord, zoom, ownerDocument) {
  var div = ownerDocument.createElement('div');
  //div.innerHTML = coord;
  div.style.width = this.tileSize.width + 'px';
  div.style.height = this.tileSize.height + 'px';
  div.style.fontSize = '10';
  div.style.borderStyle = 'none';
  div.style.borderWidth = '0px';
  //div.style.borderColor = '#AAAAAA';
  return div;
};

// ## Set up options for the grid lines map type ##
// THIS MAP TYPE IS NOT CURRENTLY USED BECAUSE THE GRID DOESN'T MATCH THE TILES :-(
// Also need to make the map type selectable in the user settings.
function coordMapType(name) {
  this.tileSize = new google.maps.Size(192, 192);
  this.maxZoom = 9;
  this.minZoom = 5;
  this.name = name;
  this.alt = 'Tile coordinate custom map type';
}

// ## Set up div for the grid lines map type ##
// THIS MAP TYPE IS NOT CURRENTLY USED BECAUSE THE GRID DOESN'T MATCH THE TILES :-(
// Also need to make the map type selectable in the user settings.
coordMapType.prototype.getTile = function(coord, zoom, ownerDocument) {
  var div = ownerDocument.createElement('div');
  div.innerHTML = "(" + (coord.x - 180 + xstart) + "," + (-coord.y + 160 + ystart) + ")";
  div.style.width = this.tileSize.width + 'px';
  div.style.height = this.tileSize.height + 'px';
  div.style.fontSize = '10';
  div.style.borderStyle = 'solid';
  div.style.borderWidth = '1px';
  div.style.borderColor = '#AAAAAA';
  return div;
};

// ##### MAIN FUNCTION #####

function load() {

  // #### Initialise map ####

  // ## Set up div for tiles - but since we use overlays, consider replacing this entirely? ##
  var div = document.getElementById("map-canvas");
  if(div==null){return;}
  if(window.innerWidth){
    div.style.width  = (window.innerWidth - 20) + "px";
    div.style.height = (window.innerHeight - 30) + "px";
    div.style.backgroundImage = 'url(default.jpg)';
  }else{
    div.style.width  = (document.documentElement.clientWidth - 20) + "px";
    div.style.height = (document.documentElement.clientHeight - 30) + "px";
    // ## This may not be the best method but it works. Consider using the proper image method. ##
    div.style.backgroundImage = 'url(default.jpg)';
  }

  // ## This is legacy v2 code left here for development information only: consider ##
  // ## removing when image method complete (see previous comment). ##
  //var tilelayers = [new GTileLayer(copyCollection, 5, 9)];
  //tilelayers[0].getTileUrl = function CustomGetTileUrl(a,b){
  //    return "default.jpg";
  //}

  // ## use the index labels in xlocations to create the list of world centres for maps ##
  mapTypesCount = 0;
  for (key in xlocations) {
    ++mapTypesCount;
    mapTypes.push(key);
  }

  // ## Set options for map ##
  var mapOptions = {
    zoom: zoomStart,
    center: latLng,
    streetViewControl: false,
    //mapTypeId: google.maps.MapTypeId.ROADMAP, // can be useful for testing
    mapTypeControlOptions: {
      //mapTypeIds: ['world1', 'world2', google.maps.MapTypeId.ROADMAP] // for reference, old hard-coded mapTypeIds
      mapTypeIds: mapTypes
    }
  };

  // ## Initialise map ##
  map = new google.maps.Map(document.getElementById('map-canvas'), 
      mapOptions);

  // ## New method of setting mapTypeIds from user settings ##
  for (i = 0; i < mapTypesCount; ++i) {
    map.mapTypes.set(mapTypes[i], new plainMapType(mapCentreNames[i]));
  }
  map.setMapTypeId(defaultMap);

  // #### Fetch region data on initialise ####
  var request = getHTTPObject();
  if(request){
    request.onreadystatechange = function(){
      parseMapResponse(request,map);
    };
    request.open("GET","data/map.php",false);
    request.send(null);
  }

  // ## Listener for re-initialising map on map type change ##
  // This resets xstart, ystart and re-draws the tiles for a different map
  google.maps.event.addListener(map, 'maptypeid_changed', function(event) {
    infoWindow.close(); marker.setMap(null); // this removes the marker and infoWindow for the old world centre
    for (i = 0; i < layerCount + 1; i++) // this loop removes the old overlay tiles
    {
      if (layer[i] != undefined) {
        layer[i].setMap(null)
      }
    }
    layerCount = 0; // restarts the count of overlay tiles
    xstart = xlocations[map.getMapTypeId()]; // gets the x location for the tiles
    ystart = ylocations[map.getMapTypeId()]; // gets the y location for the tiles
    request = getHTTPObject();
    if(request){
      request.onreadystatechange = function(){
        parseMapResponse(request,map);
      };
      request.open("GET","data/map.php",false);
      request.send(null);
    }
  });

  // #### Create the div to hold the control and call the HomeControl() to create control ####
  var homeControlDiv = document.createElement('div');
  var homeControl = new HomeControl(homeControlDiv, map);
  
  homeControlDiv.index = 1;
  map.controls[google.maps.ControlPosition.TOP_RIGHT].push(homeControlDiv);

  // #### Listeners for map events ####

  // ## Listener for map click event ##
  google.maps.event.addListener(map, 'click', function(event) {
    var clickLatLng = event.latLng;
    var x = clickLatLng.lng();
    var y = clickLatLng.lat();
    //if(overlay){return;}
    //var x = point.lng();
    xjump = Math.round(256 * (x - (x | 0)));
    if(x < 0) x--;		
    var str = x.toString();		
    str = str.substring(0, str.indexOf(".", 0));
    x = xstart - 10 + parseInt(str);
    //var y = point.lat();			
    yjump = Math.round(256 * (y - (y | 0)));
    if(y < 0) y--;	
    str = y.toString();
    str = str.substring(0, str.indexOf(".", 0));
    y = ystart - 10 + parseInt(str);
    if(isOutOfBounds(x,y)){return;}
    //show info popup if a region exists
    var content = getRegionInfos(x,y);
    if(content!=""){
      placeMarker(clickLatLng);
      infoWindow.close();
      infoWindow.setContent(content);
      infoWindow.open(map, marker);
    }
    else{
      infoWindow.close();
      marker.setMap(null);
    }						 		
  });

  // ## Placeholder for zoom event listener, currently unused ##
  //google.maps.event.addListener(map, 'zoom_changed', function() {
    //map.setMap(null);
    //var showStreetViewControl = map.getMapTypeId() != 'coordinate';
    //map.setOptions({'streetViewControl': showStreetViewControl});
  //});

  // #### Copyright notices ####
  // ## Create div for showing copyrights ##
  copyrightNode = document.createElement('div');
  copyrightNode.id = 'copyright-control';
  copyrightNode.style.fontSize = '11px';
  copyrightNode.style.fontFamily = 'Arial, sans-serif';
  copyrightNode.style.margin = '0 2px 2px 0';
  copyrightNode.style.whiteSpace = 'nowrap';
  copyrightNode.index = 0;
  map.controls[google.maps.ControlPosition.BOTTOM_RIGHT].push(copyrightNode);

  loadCopyrightCollections(mapTypesCount); // Copyright collections

  // ## Listener for map type change to update copyrights ##
  google.maps.event.addListener(map, 'idle', updateCopyrights);
  google.maps.event.addListener(map, 'maptypeid_changed', updateCopyrights);

// ## end of function load() ##
}

// ##### OTHER FUNCTIONS #####

function placeMarker(location) {
  //var infoWindow = new google.maps.InfoWindow;
  if (marker == undefined){
    // ## This should never be called and is here just in case! ##
    marker = new google.maps.Marker({
      position: location,
      title: 'Location',
      map: map,
      draggable: true,
      animation: google.maps.Animation.DROP,
    });
  }
  else{
    marker.setPosition(location);
    marker.setMap(map);
  }

  // ## Listener to remove marker when dragged ##
  google.maps.event.addListenerOnce(marker, 'dragstart', function() {
    infoWindow.close();
  });

  // ## THIS GLUES THE MARKER TO THE MOUSE: DON'T USE HERE (LEFT IN FOR INFO!) ##
  //google.maps.event.addListenerOnce(marker, 'drag', function() {
     // <code />
  //});

  // ## Listener to re-create marker when drag released ##
  google.maps.event.addListenerOnce(marker, 'dragend', function(event) {
    google.maps.event.trigger(map, 'click', event);
  });

  // ## Listener to centre map on marker if it is clicked ##
  google.maps.event.addListenerOnce(marker, 'click', function(event) {
    var latLng = marker.getPosition(); // returns LatLng object
    map.setCenter(latLng); // setCenter takes a LatLng object
  });

  // ## Listener to remove marker if infoWindow is manually closed, for neatness ##
  google.maps.event.addListenerOnce(infoWindow, 'closeclick', function(event) {
    marker.setMap(null);
  });
}

// #### Function to parse region data and create map overlays ####
function parseMapResponse(request,map){	
  if(request.readyState == 4){
    if(request.status == 200 || request.status == 304){			
      var data=parseIEBug(request);
      var root=data.getElementsByTagName('Map')[0];
      if(root==null){return;}
      __items=root.getElementsByTagName("Grid");	
      if(__items==null){return;}
      for(var i=0;i<__items.length;i++){		
        if(__items[i].nodeType == 1){
          var xmluuid=__items[i].getElementsByTagName("Uuid")[0].firstChild.nodeValue;
          var xmlregionname=__items[i].getElementsByTagName("RegionName")[0].firstChild.nodeValue;
          var xmllocX=__items[i].getElementsByTagName("LocX")[0].firstChild.nodeValue;
          var xmllocY=__items[i].getElementsByTagName("LocY")[0].firstChild.nodeValue;
          var opensimFilename = 'map-1-' + xmllocX + '-' + xmllocY + '-objects'+ '.jpg';
          xmllocX=xmllocX - xstart + 10;
          xmllocY=xmllocY - ystart + 10;
          var boundaries = new google.maps.LatLngBounds(
          new google.maps.LatLng(xmllocY,xmllocX),
          new google.maps.LatLng(xmllocY+1,xmllocX+1));
          if (filenames == "uuid-no-dashes") { // This is kept to enable compatibility with v2 code using UUIDs without dashes
            var rx=new RegExp("(-)", "g");
            xmluuid = xmluuid.replace(rx,"");
          }
          var groundOverlayOptions = {map: map, clickable: true, opacity: 0.65};
          layerCount ++;
          if (filenames == "uuid") { // Use UUID format for jpg names
            layer[layerCount] = new google.maps.GroundOverlay('data/regions/' + xmluuid + '.jpg', boundaries, groundOverlayOptions);
          }
          else if (filenames == "opensim") { // Use default opensim naming pattern for jpg names
            layer[layerCount] = new google.maps.GroundOverlay('data/regions/' + opensimFilename, boundaries, groundOverlayOptions);
          }
          layer[layerCount].setMap(map);
          // ## Listener to divert click on map overlay tiles to map click (otherwise blocked) ##
          google.maps.event.addListener(layer[layerCount], 'click', function(event) {
            google.maps.event.trigger(map, 'click', event);
          });
        }
      }	
    }
  }
}

// #### Function to return information for infoWindow ####
function getRegionInfos(x,y){
  if(__items==null){return;}
  var response="";
  for(var i=0;i<__items.length;i++){		
    if(__items[i].nodeType == 1){
      var xmllocX=__items[i].getElementsByTagName("LocX")[0].firstChild.nodeValue;
      var xmllocY=__items[i].getElementsByTagName("LocY")[0].firstChild.nodeValue;			
      if(xmllocX==x&&xmllocY==y){
        var xmluuid=__items[i].getElementsByTagName("Uuid")[0].firstChild.nodeValue;				
        var xmlregionname=__items[i].getElementsByTagName("RegionName")[0].firstChild.nodeValue;
        // #### These two lines from the old code visually remove dashes from UUIDs: seems unnecessary. ####
        //var rx=new RegExp("(-)", "g");
        //xmluuid = xmluuid.replace(rx,"");
        response="<table>";
        response+="<tr><td><span id='name'><strong>" + xmlregionname + "</strong></span></td></tr>";
        if (showUUID == "true") {
          marker.setTitle("Region UUID:\n"+xmluuid+"\nLocation: "+xmlregionname+"/"+xjump+"/"+yjump+"/");
        }else{
          marker.setTitle("Location: "+xmlregionname+"/"+xjump+"/"+yjump+"/");
        }
        response+="<tr><td><span id='loc'>" + "(" + xmllocX + ", " + xmllocY + ")" + "</span></td></tr>";
        response+="<tr><td><a class=\"add\" href=\"secondlife://"+hgdomains[map.getMapTypeId()]+":"+hgports[map.getMapTypeId()]+":"+xmlregionname+"/"+xjump+"/"+yjump+"/\">Hypergrid</a>&nbsp;&nbsp;</td>";
        xmlregionname = xmlregionname.replace(" ","+"); // fix for V3 HG URL
        response+="<td><a class=\"add\" href=\"secondlife://http|!!"+hgdomains[map.getMapTypeId()]+"|"+hgports[map.getMapTypeId()]+"+"+xmlregionname+"\">V3 HG</a>&nbsp;&nbsp;</td>";
        xmlregionname = xmlregionname.replace("+"," "); // change back for local URL
        response+="<td><a class=\"add\" href=\"secondlife://"+xmlregionname+"/"+xjump+"/"+yjump+"/\">Local</a></td></tr>";
      }
    }	
  }	
  return response;
}

// #### Function to prevent click outside preset bounds - not vital but kept from v2 code ####
function isOutOfBounds(x,y){
  if(x<xstart-30||x>xstart+30){return true;}
  if(y<ystart-30||y>ystart+30){return true;}
  return false;
}

// #### Function to fix IE bug, kept from v2 code - still required? ####
function parseIEBug(request){	
  if (document.implementation && document.implementation.createDocument){
    xmlDoc = request.responseXML;
  }else if (window.ActiveXObject){
  var testandoAppend = document.createElement('xml');
  testandoAppend.setAttribute('innerHTML',request.responseText);
  testandoAppend.setAttribute('id','_formjAjaxRetornoXML');
  document.body.appendChild(testandoAppend);
  document.getElementById('_formjAjaxRetornoXML').innerHTML = request.responseText;
  xmlDoc = document.getElementById('_formjAjaxRetornoXML');
  }
  return xmlDoc;
}

// #### Function to get HTTP object ####
function getHTTPObject(){
  var xhr = false;
  if(window.XMLHttpRequest){
    var xhr = new XMLHttpRequest();
  }else if(window.ActiveXObject) {
    try{
      var xhr = new ActiveXObject("Msxml2.XMLHTTP");
    }catch(e){
      try{
        var xhr = new ActiveXObject("Microsoft.XMLHTTP");
      }catch(e){xhr=false;}
    }
  }
  return xhr;
}

// #### Function to update copyrights if map type changed ####
function updateCopyrights() {
  var notice = '';
  var collection = copyrights[map.getMapTypeId()];
  var bounds = map.getBounds();
  var zoom = map.getZoom();
  if (collection && bounds && zoom) {
    notice = collection.getCopyrightNotice(bounds, zoom);
  }
  copyrightNode.innerHTML = notice;
}

// #### Function to load copyright collections for custom map types ####
function loadCopyrightCollections(mapTypesCount) {
  var collection = new Array();
  for (i = 0; i < mapTypesCount; ++i) {
    //map.mapTypes.set(mapTypes[i], new plainMapType(mapCentreNames[i]));
    collection[i] = new CopyrightCollection('Map data &copy;2012');
    collection[i].addCopyright(new Copyright(   
    1,
    new google.maps.LatLngBounds(
        new google.maps.LatLng(-90, -179), new google.maps.LatLng(90, 180)),
    0,
    copyrightNotices[i]));  
    copyrights[mapTypes[i]] = collection[i];
  }
}

// #### Function to set up home control ####
function HomeControl(controlDiv, map) {

  // ## Set CSS styles for the DIV containing the control ##
  // Setting padding to 5 px will offset the control
  // from the edge of the map.
  controlDiv.style.padding = '5px';

  // ## Set CSS for the control border ##
  var controlUI = document.createElement('div');
  controlUI.style.backgroundColor = 'white';
  controlUI.style.borderStyle = 'solid';
  controlUI.style.borderWidth = '2px';
  controlUI.style.cursor = 'pointer';
  controlUI.style.textAlign = 'center';
  controlUI.title = 'Click to set the map to Home';
  controlDiv.appendChild(controlUI);

  // ## Set CSS for the control interior ##
  var controlText = document.createElement('div');
  controlText.style.fontFamily = 'Arial,sans-serif';
  controlText.style.fontSize = '12px';
  controlText.style.paddingLeft = '4px';
  controlText.style.paddingRight = '4px';
  controlText.innerHTML = '<strong>Home<strong>';
  controlUI.appendChild(controlText);

  // ## Set up the click event listeners ##
  google.maps.event.addDomListener(controlUI, 'click', function() {
    map.setCenter(latLng)
  });
}
