var CONVERSION_VALUE = 50.0;
var MIN_NUM_CONVERSIONS = 25;

function main() { 
  ////setAdGroupBids("ALL_TIME");
  
  setAdGroupBids("LAST_30_DAYS");
  setAdGroupBids_highCost("LAST_30_DAYS");
  setAdGroupBids("LAST_14_DAYS");
  setAdGroupBids_highCost("LAST_14_DAYS");
  setAdGroupBids("LAST_7_DAYS");
  setAdGroupBids_highCost("LAST_7_DAYS");
  
  
  setKeywordBids("LAST_30_DAYS");
  setKeywordBids_highCost("LAST_30_DAYS");
  setKeywordBids("LAST_14_DAYS");  
  setKeywordBids_highCost("LAST_14_DAYS");
  setKeywordBids("LAST_7_DAYS");
  setKeywordBids_highCost("LAST_7_DAYS");
}



// ******************************************************************
// SET ADGROUP BIDS
// ******************************************************************
function setAdGroupBids(dateRange) {
   var adGroupIterator = AdWordsApp.adGroups()
      .forDateRange(dateRange)
      .withCondition("Status = ENABLED")
      .withCondition("CampaignStatus = ENABLED")
      .withCondition("LabelNames CONTAINS_NONE ['Script Ignore']")
      .withCondition("ConvertedClicks > " + MIN_NUM_CONVERSIONS)
      .get();
  
  Logger.log('Total adGroups found : ' + adGroupIterator.totalNumEntities());
  
  while (adGroupIterator.hasNext()) {
    var adGroup = adGroupIterator.next();
    var stats = adGroup.getStatsFor(dateRange);
    var conv_rate = stats.getClickConversionRate();
    var max_cpc = roundDown(conv_rate * CONVERSION_VALUE);
    
    //Logger.log('AdGroup Name: ' + adGroup.getName() + ' ConvRate:' + conv_rate + ' MaxCPC:' + max_cpc);   
    adGroup.bidding().setCpc(max_cpc);
  } 
}

// ******************************************************************
// SET ADGROUP BIDS FOR HIGH COST ADWORDS
// ******************************************************************
function setAdGroupBids_highCost(dateRange) {
   Logger.log('\nHigh Cost AdGroups : ' + dateRange);
    var highCostThreshold = (CONVERSION_VALUE * .80);

   var adGroupIterator = AdWordsApp.adGroups()
      .forDateRange(dateRange)
      .withCondition("Status = ENABLED")
      .withCondition("CampaignStatus = ENABLED")
      .withCondition("LabelNames CONTAINS_NONE ['Script Ignore']")
      .withCondition("ConvertedClicks <= " + MIN_NUM_CONVERSIONS)
      .get();

  Logger.log('Total adGroups found : ' + adGroupIterator.totalNumEntities());
  
  while (adGroupIterator.hasNext()) {
    var adGroup = adGroupIterator.next();
    var stats = adGroup.getStatsFor(dateRange);
    var conversions = stats.getConvertedClicks();
    var clicks = stats.getClicks();
    var cost = stats.getCost();
    var conv_rate = stats.getClickConversionRate();

    if( conversions == 0 && clicks > 0) {
      conversions = 1;
      conv_rate = conversions / clicks;
    }
    
    var cpa = cost / conversions;

    if (cpa > highCostThreshold) {
      var max_cpc = roundDown(conv_rate * CONVERSION_VALUE);
      
      if( max_cpc < adGroup.bidding().getCpc()) {
        adGroup.bidding().setCpc(max_cpc);
      }
    }
  } 
}



// ******************************************************************
// SET KEYWORD BIDS
// ******************************************************************
function setKeywordBids(dateRange) {
  Logger.log('\nSet Keyword Bids : ' + dateRange);
  
   var KeywordIterator = AdWordsApp.keywords()
      .forDateRange(dateRange)
      .withCondition("Status = ENABLED")
      .withCondition("CampaignStatus = ENABLED")
      .withCondition("AdGroupStatus = ENABLED")
      .withCondition("LabelNames CONTAINS_NONE ['Script Ignore']")
      .withCondition("ConvertedClicks > " + MIN_NUM_CONVERSIONS)
      .get();
  
  Logger.log('Total Keywords found : ' + KeywordIterator.totalNumEntities());
  
  while (KeywordIterator.hasNext()) {
    var keyword = KeywordIterator.next();
    var stats = keyword.getStatsFor(dateRange);
    var conv_rate = stats.getClickConversionRate();
    var max_cpc = roundDown(conv_rate * CONVERSION_VALUE);

    // Temp variables
    var keywordBidding = keyword.bidding();
    var keywordCpc = keywordBidding.getCpc();
    
    // Calculate Range for wich we want to keep adgroup bids
    var AdGroupCpc = keyword.getAdGroup().bidding().getCpc();
    var AdGroupCpcMin = AdGroupCpc * 0.9;
    var AdGroupCpcMax = AdGroupCpc * 1.1;
    
    if( max_cpc > keywordCpc && stats.getAveragePosition() < 1.2 ) {
      Logger.log('Keyword: ' + keyword.getText() + ' Position too high. Bid not updated.');
    } else if( max_cpc > AdGroupCpcMin && max_cpc < AdGroupCpcMax ) {
      keywordBidding.clearCpc();
      Logger.log('Keyword: ' + keyword.getText() + ' Keyword text reset to AdGroup bid');
    } else {
      Logger.log('Keyword: ' + keyword.getText() + ' ConvRate:' + conv_rate + ' MaxCPC:' + max_cpc);   
      keywordBidding.setCpc(max_cpc);
    }
  } 
}


// ******************************************************************
// SET KEYWORD BIDS, HIGH COST
// ******************************************************************
function setKeywordBids_highCost(dateRange) {
  Logger.log('\nSet Keyword Bids, High Cost : ' + dateRange);
 var highCostThreshold = (CONVERSION_VALUE * .80);   
  
 var KeywordIterator = AdWordsApp.keywords()
      .forDateRange(dateRange)
      .withCondition("Status = ENABLED")
      .withCondition("CampaignStatus = ENABLED")
      .withCondition("AdGroupStatus = ENABLED")
      .withCondition("LabelNames CONTAINS_NONE ['Script Ignore']")
      .withCondition("ConvertedClicks <= " + MIN_NUM_CONVERSIONS)
      .get();
  
  Logger.log('Total Keywords found : ' + KeywordIterator.totalNumEntities());
  
  while (KeywordIterator.hasNext()) {
    var keyword = KeywordIterator.next();
    var stats = keyword.getStatsFor(dateRange);
    var conversions = stats.getConvertedClicks();
    var clicks = stats.getClicks();
    var cost = stats.getCost();
    var conv_rate = stats.getClickConversionRate();

    if( conversions == 0 && clicks > 0) {
      conversions = 1;
      conv_rate = conversions / clicks;
    }
    
    var cpa = cost / conversions;
    
    if (cpa > highCostThreshold) {
      var max_cpc = roundDown(conv_rate * CONVERSION_VALUE);
      
      if( max_cpc < keyword.bidding().getCpc()) {
        keyword.bidding().setCpc(max_cpc);
      }
    }     
  } 
}




// Round down bids to the closest quarter dollar.
function roundDown(value) {
  var suffix = value % 1;
  var prefix = value - suffix;
  
  var newSuffix = suffix;

  if( suffix < 0.25 ) {
    if( prefix > 0 ) newSuffix = 0.0;
  } else if( suffix < 0.50 ) {
    newSuffix = 0.25 ;
  } else if( suffix < 0.75) {
    newSuffix = 0.50;
  } else {
    newSuffix = 0.75;
  }
  
  var newBid = prefix + newSuffix;
  
  //Logger.log('bid: ' + value + '; new bid: ' + newBid);
  
  return newBid;
}