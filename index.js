var axios = require('axios')
var cheerio = require('cheerio');
var NodeGeocoder = require('node-geocoder');
const yelp = require('yelp-fusion');


var restaurants = [];
var restaurantURLS = [];
var baseURL = "http://www.ramw.org";
var yelpURL = "https://api.yelp.com/v3/businesses/search"

var dcRW = {
  getRestaurants: async (mapQuestAPIKey, yelpAPIKey) => {
    const client = yelp.client(yelpAPIKey);
    for(i=0; i < 12; i++){

      var url = "http://www.ramw.org/restaurantweek?page="+i;
      await getPage(url);
      
    }
    for(i = 0; i < restaurantURLS.length; i++){
      await getRestaurantData(restaurantURLS[i], mapQuestAPIKey, client)
    }
    return restaurants;
  }

}

const getPage = async (url) => {
  try {
    var response = await axios.get(url);
    $ = cheerio.load(response.data);
    var count = 0;
    var restos = [];
    restaurantCnt = $("div.views-field.views-field-title").length;
    $("div.views-field.views-field-title a").filter(function(i, el){
      var data = $(this);
      var link = data.attr('href');
      restaurantURLS.push(baseURL + link);
    });

  } catch (error){
    console.log(error)
  } 
}

const getRestaurantData = async (url, mapQuestAPIKey, yelpClient) => {
  var restaurantData = {};
  try {
    var response = await axios.get(url);
    $ = cheerio.load(response.data);
    var src = $("div.field-content img").attr("src");
    restaurantData.name = $("h1#restaurantname_tpl").text();
    restaurantData.logoURL = src;
    restaurantData.rwURL = url;
    var street = $("div.street-block .thoroughfare").text()
    restaurantData.address = street;
    var city = $("span.locality").text()
    restaurantData.city = city;
    var zipcode = $("span.postal-code").text()
    restaurantData.zipcode = zipcode;
    var state = $("span.state").text()
    restaurantData.state = state;
    restaurantData.brunch = $("div.icon.brunch").hasClass("active");
    restaurantData.lunch = $("div.icon.lunch").hasClass("active");
    restaurantData.dinner = $("div.icon.dinner").hasClass("active");
    var cuisine = []
    $("div.field-name-field-cuisine div.field-item").filter((i, el) => {
      var catagory = $(el);
      cuisine.push(catagory.text())
    })

    restaurantData.cuisine = cuisine;

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

    await getYelpData(restaurantData, yelpClient)

  } catch(error){
    console.log(error)
  }

}

const getYelpData = async (restaurantData, yelpClient) => {
  const searchRequest = {
    term: restaurantData.name,
    location: `${restaurantData.city.toLowerCase()}, ${restaurantData.state.toLowerCase()}`
  }

  yelpClient.search(searchRequest).then(response => {
    const firstResult = response.jsonBody.businesses[0];
    const prettyJson = JSON.stringify(firstResult, null, 4);
    if(firstResult){
      restaurantData.yelpRating = firstResult.rating;
      restaurantData.priceRange = firstResult.price;
  
      restaurants.push(restaurantData)
    } 

  }).catch(e => {
    console.log(e);
  });
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

  module.exports = dcRW;
  