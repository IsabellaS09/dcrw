var axios = require('axios')
var cheerio = require('cheerio');
var NodeGeocoder = require('node-geocoder');

var restaurants = [];

var dcRW = {
  getRestaurants: async (mapQuestAPIKey) => {
    
    for(i=0; i < 15; i++){

      var url = "http://www.ramw.org/restaurantweek/list?page="+i;
      await getPage(url, mapQuestAPIKey);
      
    }
    return restaurants;
  }

}

const getPage = async (url, mapQuestAPIKey) => {
  try {
    var response = await axios.get(url);
    $ = cheerio.load(response.data);
    var count = 0;
    var restos = [];
    restaurantCnt = $("tr.odd,tr.even").length;
    $("tr.odd,tr.even").filter(function(){
      var data = $(this);
      var restaurantData = {};
      var firstBlock = data.children('td.views-field-title');

      restaurantData.name = firstBlock.children('div.pop').text();
      restaurantData.address = firstBlock.children('div.street-block').children('div.thoroughfare').text();
      restaurantData.city = firstBlock.children('div.addressfield-container-inline').children("span.locality").text();
      restaurantData.state = firstBlock.children('div.addressfield-container-inline').children("span.state").text();
      restaurantData.zipcode =  firstBlock.children('div.addressfield-container-inline').children("span.postal-code").text();
      if(restaurantData.name.length === 0){
        return;
      }
      var secondBlock = data.children('td.views-field-nothing-1');
      restaurantData.cuisine = secondBlock.children('p').text().split(', ');
      restaurantData.brunch = secondBlock.children('div.active.brunch').text() === "Brunch";
      restaurantData.lunch = secondBlock.children('div.active.lunch').text() === "Lunch";
      restaurantData.dinner = secondBlock.children('div.active.dinner').text() === "Dinner";
      var thirdBlock = data.children('td.views-field-field-tax-neighborhood');
      restaurantData.neighborhood = thirdBlock.text().trim().split(', ');
      var fourthBlock = data.children('td.views-field-nothing');
      var lunchMenu = fourthBlock.children('div.brunchbox').children('a').text() === "Brunch Menu";
      var lunchMenu = fourthBlock.children('div.lunchbox').children('a').text() === "Lunch Menu";
      var dinnerMenu = fourthBlock.children('div.dinnerbox').children('a').text() === "Dinner Menu";
      restaurantData.menuOnwebsite = dinnerMenu && lunchMenu;
      var fifthBlock = data.children('td.views-field-field-mem-opentable-1');
      var brunchRes = fifthBlock.children('div.brunch-reservation-button').length === 1;
      var lunchRes = fifthBlock.children('div.lunch-reservation-button').length === 1;
      var dinnerRes = fifthBlock.children('div.dinner-reservation-button').length === 1;
      restaurantData.openTableRes = brunchRes || lunchRes || dinnerRes;
      if(dinnerRes){
        restaurantData.openTableID = getJsonFromUrl(fifthBlock.children('div.dinner-reservation-button').children('a').attr('href'))['rid'];
      } else if(lunchRes) {
        restaurantData.openTableID = getJsonFromUrl(fifthBlock.children('div.lunch-reservation-button').children('a').attr('href'))['rid'];
      } else if(brunchRes){
        restaurantData.openTableID = getJsonFromUrl(fifthBlock.children('div.brunch-reservation-button').children('a').attr('href'))['rid'];
      }

      var options = {
        provider: 'mapquest',
        apiKey: mapQuestAPIKey,
        formatter: null
      }
      
     var geocoder = NodeGeocoder(options);
       geocoder.geocode(restaurantData.address + " " + restaurantData.city + ", " + restaurantData.state, function(err, res){
         restaurantData.lat = res[0].latitude;
         restaurantData.lon = res[0].longitude;
      })
      
      count++;
      restos.push(restaurantData);
      if(count == restaurantCnt){
        restaurants = restaurants.concat(restos);
      }

    });

  } catch (error){
    console.log(error)
  } 
}
 
  function getJsonFromUrl(hashBased) {
    var query;
    if(hashBased) {
      var pos = hashBased.indexOf("?");
      if(pos==-1) return [];
      query = hashBased.substr(pos+1);
    } 
    var result = {};
    query.split("&").forEach(function(part) {
      if(!part) return;
      part = part.split("+").join(" "); // replace every + with space, regexp-free version
      var eq = part.indexOf("=");
      var key = eq>-1 ? part.substr(0,eq) : part;
      var val = eq>-1 ? decodeURIComponent(part.substr(eq+1)) : "";
      var from = key.indexOf("[");
      if(from==-1) result[decodeURIComponent(key)] = val;
      else {
        var to = key.indexOf("]",from);
        var index = decodeURIComponent(key.substring(from+1,to));
        key = decodeURIComponent(key.substring(0,from));
        if(!result[key]) result[key] = [];
        if(!index) result[key].push(val);
        else result[key][index] = val;
      }
    });
    return result;
  }

  module.exports = {
    dcRW
  }