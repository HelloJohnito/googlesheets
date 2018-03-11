var dataParams = {
  "criteria": {
    "dimension": "",
    "child": null
  },
  "kpi": {
    "incomingAdRequests": true,
    "servedAds": true,
    "impressions": true,
    "clicks": false,
    "ctr": false,
    "eCPM": false,
    "grossRevenue": true,
    "netRevenue": true,
    "fillrate": true
  },
  "period": {
    "period_type": "fixed",
    "start_date": "",
    "end_date": ""
  }
};

// credentials
var clientId = '';
var clientSecret = "";


// MAIN FUNCTION
function getData(dimension, date) {
  if(!dimension || !date){
    return "Ad Space Id or Date was not provided";
  }
  var option = {
    'method': 'POST',
    'dataType': 'json',
    'contentType': 'application/x-www-form-urlencoded',
    'payload': {
        'client_id': clientId,
        'client_secret': clientSecret,
        'grant_type': 'client_credentials'
      }
  };

  //fetch auth token
  var result = UrlFetchApp.fetch('https://auth.smaato.com/v2/auth/token/', option);
  var jsonResult = JSON.parse(result.getContentText());
  var authToken = jsonResult["access_token"];

  //format the date
  var formatedDate = convertDate(date);
  dataParams["period"]["start_date"] = formatedDate;
  dataParams["period"]["end_date"] = formatedDate;

  //make a request
  if (typeof dimension === 'number'){
    dataParams['criteria']['dimension'] = "AdspaceId";
    return requestDataWithInformation(authToken, dimension, dataParams);
  } else {
    dataParams['criteria']['dimension'] = "ApplicationId";
    return requestDataWithInformation(authToken, dimension.toUpperCase(), dataParams);
  }
}

// Request for data
function requestDataWithInformation(token, dimensionValue, data){
  var id = null;

  if(dimensionValue === "IOS"){
    id = 120000494;
  } else if(dimensionValue === "ANDROID"){
    id = 120000491;
  } else if(typeof dimensionValue === "number"){
    id = dimensionValue;
  } else {
    return "AdSpaceId or App is incorrect";
  }

  var response = sendRequestToSoma(token, data);
  var selectedObject = selectObjectById(response, id);

  if(selectedObject){
    var finalFormat = formatData(selectedObject);
    return finalFormat;
  }
  else {
    return handleError(dimensionValue);
  }

}



// HELPER FUNCTIONS

function sendRequestToSoma(token, requestData){
   var option = {
    'headers': {
      'Authorization': 'Bearer ' + token
    },
    'method': 'POST',
    'contentType': 'application/json',
    'payload': JSON.stringify(requestData)
  };

  var result = UrlFetchApp.fetch('https://api.smaato.com/v1/reporting/', option);
  var stringResult = result.getContentText();
  var response = JSON.parse(stringResult);
  return response;
}


function selectObjectById(object, id){
  var selectedObject;
  for(var i = 0; i < object.length; i++){
     if(object[i]["criteria"][0]["value"] === id){
      selectedObject = object[i];
      return selectedObject;
    }
  }
  return false;
}


function formatData(data){
  var getDataForColumns = ["incomingAdRequests", "servedAds", "fillrate", "impressions", "grossRevenue", "netRevenue"];
  var outputData = [[]];
  var imp = data["kpi"]["impressions"];

  for(var i = 0; i < getDataForColumns.length; i ++){
    var column = getDataForColumns[i];
    var cellInput = data["kpi"][column];

    if (column === "grossRevenue" || column === "netRevenue"){
      outputData[0].push(convertRevenueToRate(column, cellInput, imp));
    }
    else {
      outputData[0].push(cellInput);
    }
  }

  outputData[0].push(cellInput);
  return outputData;
}


function convertDate(date){
  var month = String(date.getMonth() % 12 + 1);
  var newDate = String(date.getYear()) + "-" + month + "-" + String(date.getDate());
  return newDate;
}


function convertRevenueToRate(col, cost, impression){
  return cost / impression * 1000;
}


function handleError(value){
  if(typeof value === "number"){
    return "Adspace Id is incorrect or the adspace did not run on this day.";
  } else {
    return "The App did not run.";
  }
}
