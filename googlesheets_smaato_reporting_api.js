var dataParams = {
  "criteria": {
    "dimension": "AdspaceId",
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
    "start_date": "2017-12-05",
    "end_date": "2017-12-11"
  }
};


function requestData(adSpaceId, date) {
  if(adSpaceId && date){
    return retrieveData(adSpaceId, date);
  }
  return "No Adspace or date provided";
}


function retrieveData(adSpaceId, date){
  var formatedDate = convertDate(date);
  dataParams["period"]["start_date"] = formatedDate;
  dataParams["period"]["end_date"] = formatedDate;

  var option = {
    'headers': {
      'Authorization': `Bearer ${AuthCodeHere}`
    },
    'method': 'POST',
    'contentType': 'application/json',
    'payload': JSON.stringify(dataParams)
  };

  var result = UrlFetchApp.fetch('https://api.smaato.com/v1/reporting/', option);
  var stringResult = result.getContentText();
  var json = JSON.parse(stringResult);

  var selectedAdSpaceJson = selectAdSpace(json, adSpaceId);
  if(!selectedAdSpaceJson){
    return "Adspace not found on this day";
  }

  var finalFormat = formatData(selectedAdSpaceJson);
  return finalFormat;
}



// Helper Functions

function selectAdSpace(object, adSpaceId){
  var selectedAdSpaceJson;
  for(var i = 0; i < object.length; i++){
     if(object[i]["criteria"][0]["value"] === adSpaceId){
      selectedAdSpaceJson = object[i];
      return selectedAdSpaceJson;
    }
  }
  return false;
}


function formatData(data){
  var getDataForColumns = ["incomingAdRequests", "servedAds", "impressions", "fillrate" ,"grossRevenue", "netRevenue"];
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
