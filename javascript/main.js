//link: https://airmap.g0v.asper.tw/api/nearby?lat=24.256&lng=120.7435
//https://maps.google.com.tw/maps?f=q&hl=zh-TW&geocode=&q=25.07595,121.6919&z=16&output=embed&t=

var position;
var JSONdata;
var time_gap = 10000;
var mode = 2;//1:averge, 2:single
var gps_on = true;
var timeHandle;
var link = "https://airmap.g0v.asper.tw/api/nearby";

function resizeing(){
	var w_width = $(window).width();
	var w_height = $(window).height();
	var c_width = $("#center").width();
	var c_height = $("#center").height();
	$("#plate").width(w_width + 'px');
	$("#plate").height(w_height + 'px');
	$("#center").css({'left' : (w_width - c_width) / 2, 'top' : (w_height - c_height) / 2 - 150});
}

function color(v){
	if(v < 11){
		return "9CFF9C";
	}else if(v < 23){
		return "31FF00";
	}else if(v < 35){
		return "31CF00";
	}else if(v < 41){
		return "FFFF00";
	}else if(v < 47){
		return "FFCF00";
	}else if(v < 53){
		return "FF9A00";
	}else if(v < 58){
		return "FF6363";
	}else if(v < 64){
		return "FF0000";
	}else if(v < 70){
		return "990000";
	}else{
		return "CD2FFE";
	}
}

function advise(v, str){
	if(str === "normal"){
		if(v <= 53){
			return "正常戶外活動。";
		}else if(v <= 70){
			return "應考慮減少戶外活動";
		}else{
			return "應避免戶外活動";
		}
	}else if(str === "Special"){
		if(v <= 35){
			return "正常戶外活動。";
		}else if(v <= 53){
			return "應考慮減少戶外活動";
		}else if(v <= 70){
			return "應減少戶外活動";
		}else{
			return "應避免戶外活動";
		}
	}
}

function getValue(str, arrary){
	for(var i = 0; i <= arrary.length-1; i ++){
		if(arrary[i].name == str){
			return arrary[i].value;
		}
	}
}

function gmapLink(lat, lng){
	return "https://maps.google.com.tw/maps?f=q&hl=zh-TW&geocode=&q=" + lat + "," + lng + "&z=16&output=embed&t="
}

function updateGpsInfo(){
	var latitude = position.lat;
	var longitude = position.lng;
	if(Object.is(latitude, NaN) || Object.is(longitude, NaN)){
		$("#gps").html('錯誤的位置');
		return;
	}
	$("#gps").html("(" + Math.round(latitude*100000)/100000 + "," + Math.round(longitude*100000)/100000 + ")");
	$("#Map").attr("src", gmapLink(latitude, longitude));
}

function ApplyOptions(data){
	if(getValue("value_mode", data) === "averge"){
		mode = 1;
	}else{
		mode = 2;
	}
	if(getValue("gps_mode", data) === "auto"){
		gps_on = true;
		time_gap = parseInt(getValue("time_gap", data)) * 1000;
	}else{
		var lat, lng;
		gps_on = false;
		if(getValue("gps_type", data) === "十進位制"){
			lat = parseFloat(getValue("inputlat", data));
			lng = parseFloat(getValue("inputlng", data));
		}else{
			lat1 = parseInt(getValue("inputlat1", data));
			lat2 = parseInt(getValue("inputlat2", data));
			lat3 = parseFloat(getValue("inputlat3", data));
			if(!Object.is(lat1, NaN) && !Object.is(lat2, NaN) && !Object.is(lat3, NaN)){
				lat = lat1 + (lat2 / 60) + (lat3 / 3600);
				if(getValue('latNS', data) === 'S'){
					lat *= -1;
				}
			}else{
				lat = NaN;
			}
			lng1 = parseInt(getValue("inputlng1", data));
			lng2 = parseInt(getValue("inputlng2", data));
			lng3 = parseFloat(getValue("inputlng3", data));
			if(!Object.is(lng1, NaN) && !Object.is(lng2, NaN) && !Object.is(lng3, NaN)){
				lng = lng1 + (lng2 / 60) + (lng3 / 3600);
				if(getValue('latWE', data) === 'W'){
					lng *= -1;
				}
			}else{
				lng = NaN;
			}
		}
		position = {
			'lat' : lat,
			'lng' : lng
		}
	}
		
	updateGpsInfo();
}

function mapServiceProvider(latitude, longitude) {
	position = {
		'lat' : latitude,
		'lng' : longitude
	}
	console.log(position);
	updateGpsInfo();
}

function gps(f){
	var subtitle_text = $("#subtitle");
	if(navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(function(position){
			mapServiceProvider(position.coords.latitude, position.coords.longitude);
			if(f)f();
		},
		function(error) {
			switch (error.code) {
				case error.TIMEOUT:
					subtitle_text.html('連線逾時');
					break;
				case error.POSITION_UNAVAILABLE:
					subtitle_text.html('無法取得定位');
					break;
				case error.PERMISSION_DENIED:
					subtitle_text.html('請允許瀏覽器的GPS定位功能');
					break;
				case error.UNKNOWN_ERROR:
					subtitle_text.html('不明的錯誤，請稍候再試');
					break;
			}
			resizeing();
		});
	}else if(window.google && google.gears){
		try {
			var geo = google.gears.factory.create('beta.geolocation');
			geo.getCurrentPosition(function(p){
				mapServiceProvider(p.latitude, p.longitude);
				if(f)f();
			}, function (err){
				subtitle_text.html('Error:' + err);
			}, {enableHighAccuracy: true, gearsRequestAddress: true});
    	}catch(e) { 
			subtitle_text.html('定位失敗');
			resizeing();
		}
  	}else{
		subtitle_text.html('請允許瀏覽器的GPS定位功能');
		resizeing();
	}
}

function loop(){
	if(position){
		if(gps_on) gps();
		if(!Object.is(position.lat, NaN) && !Object.is(position.lng, NaN)){
			$.getJSON(link, {lat: position.lat, lng: position.lng}).done(function(data){
				console.log(data);
				JSONdata = data;
				var data_length = data.sites.length;
				var v = 0;
				if(data_length != 0){
					if(mode === 1){
						$("#subtitle").html("來自附近" + data_length + "個站點");
							var total = 0;
							for(var i = 0; i <= data_length-1; i ++){
								total += data.sites[i].Data.Dust2_5;
							}
							v = total / data_length;
					}else if(mode === 2){
						var minDistance = Infinity;
						var minIndex = -1;
						for(var i = 0; i <= data_length-1; i ++){
							var gps_ = data.sites[i].LatLng;
							var dis = Math.pow(gps_.lat - position.lat, 2) + Math.pow(gps_.lng - position.lng, 2);
							console.log(dis);
							if(dis < minDistance){
								minDistance = dis;
								minIndex = i;
							}
						}
						$("#subtitle").html(data.sites[minIndex].SiteName);
						v = data.sites[minIndex].Data.Dust2_5;
					}
				}else{
					$("#subtitle").html("附近沒有站點");
				}
				$("#value").html((Math.round((v * 100)) / 100) + "μg/m<sup>3</sup>");
				$("#plate").css({"background-color": "#" + color(v)});
				$("#normalAdvise").html("一般民眾：" + advise(v, "normal"));
				$("#specialAdvise").html("敏感性族群：" + advise(v, "Special"));
				resizeing();
			});
		}
		timeHandle = setTimeout(loop, time_gap);
	}else{
		timeHandle = setTimeout(loop, 1000);
	}
}

$(document).ready(function(){
	resizeing();
	$(window).resize(resizeing);

	$("#value").html(0);
	$("#subtitle").html("Loading...");
	resizeing();

	$("#gear").click(function(){$("#optionModal").modal('show')});
	$("#optionApply").click(function(){
		$("#optionModal").modal('hide');
		var formData = $("#optionForm").serializeArray();
		console.log(formData);
		clearTimeout(timeHandle);

		ApplyOptions(formData);

		loop();
	});

	$("#auto_gps_option").click(function(){
		console.log("select auto");
		$("#auto_gps").css({"display": "block"});
		$("#order_gps").css({"display": "none"});
	});
	$("#order_gps_option").click(function(){
		console.log("select order");
		$("#auto_gps").css({"display": "none"});
		$("#order_gps").css({"display": "block"});
	});
	$("#gps_type").change(function(){
		console.log($("#gps_type").val());
		if($("#gps_type").val() === "度分秒制"){
			$("#degree_div").css({"display": "block"});
			$("#decimal_div").css({"display": "none"});
		}else{
			$("#degree_div").css({"display": "none"});
			$("#decimal_div").css({"display": "block"});
		}
	});

	$("#set_gps").click(function(){
		gps(function(){
			$("#inputlat").val(position.lat);
			$("#inputlng").val(position.lng);
			if(position.lat < 0){
				$("#latNS").val("S");
			}else{
				$("#latNS").val("N");
			}
			if(position.lng < 0){
				$("#latWE").val("W");
			}else{
				$("#latWE").val("E");
			}
			var lat2 = position.lat % 1;
			var lat1 = position.lat - lat2;
			lat2 *= 60;
			var lat3 = lat2 % 1;
			lat2 = lat2 - lat3;
			lat3 *= 60;
			var lng2 = position.lng % 1;
			var lng1 = position.lng - lng2;
			lng2 *= 60;
			var lng3 = lng2 % 1;
			lng2 = lng2 - lng3;
			lng3 *= 60;

			$("#inputlat1").val(lat1);
			$("#inputlat2").val(lat2);
			$("#inputlat3").val(lat3);
			$("#inputlng1").val(lng1);
			$("#inputlng2").val(lng2);
			$("#inputlng3").val(lng3);
		});
	});

	gps();
	loop();
});