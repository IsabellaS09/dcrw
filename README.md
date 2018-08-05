# dcrw

This npm module just parses the dc restaurant week pages and returns an array of restaurant objects.

The object has these properties:

`name` - the restaurant name
`address` - restaurant street address
`city` - city the restaurant is located in 
`state` - state the restaurant is located in 
`zipcode` - zipcode the restaurant is located in 
`cuisine` - I believe this is something provided by the restaurant when they sign up for restaurant week, some restaurants can have several listed 
`brunch` - boolean if the restaurant has a RW brunch menu
`lunch` - boolean if the restaurant has a RW lunch menu
`dinner` - boolean if the restaurant has a RW dinner menu
`neighborhood` - the DC neighborhood 
`menuOnwebsite` - boolean if the menu is available on the restaurant week website
`openTableRes` - if you can make reservations on opentable
`openTableID` - this is the openTable restaurant id
`lat` - latitude provided by mapquest API
`lon` - longitude provided by mapquest API

To use this app you should have a mapquest API key because this data (at the moment) is intended to be mapped and the restaurant addresses have to be geocoded.

The proper way to call the function is 
```
var dcRW = require('dcrw')

async function main(){
  var rests = await dcRW.getRestaurants(${mapQuestAPIKey});
}

main();
```
