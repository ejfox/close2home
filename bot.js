require('dotenv').config()
var Twit = require('twit');
var TwitterBot = require('node-twitterbot').TwitterBot;

var Bot = new TwitterBot({
 consumer_key: process.env.BOT_CONSUMER_KEY,
 consumer_secret: process.env.BOT_CONSUMER_SECRET,
 access_token: process.env.BOT_ACCESS_TOKEN,
 access_token_secret: process.env.BOT_ACCESS_TOKEN_SECRET
});

var _ = require('lodash');
var request = require('request')

/*
// Sample headlines for testing
var headlinesArray = [
  'Syrian Army missile strike destroys jihadist bulldozer in northern Homs'
  ,'Russian Warplanes Strike Syrian Targets, as Barrel Bombs Hit Aleppo'
  ,'Air strike hits third Syrian hospital in 24 hours: monitor'
  ,'Syrian opposition activists say airstrike in Aleppo province kills 18, including 6 women - AP'
  ,'World Health Organization says it condemns attacks on 6 hospitals in Syria on Nov. 13-16'
  ,'Cruise missile strikes from naval frigate not targeting Aleppo, Russian defense ministry says'
  ,'Russian aircraft carrier took part in strikes against Syria, Russia\'s defense minister confirms'
  ,'European Union adds 17 Syrian government minister and central bank governors to sanctions list - Reuters'
  ,'Russian Defense Ministry says illegal armed units conduct 35 strikes on Syrian populated areas and facilities in past day'
  ,'Report: Russian warship flotilla now off Syrian coast, military say'
  ,'US-backed Syria Democratic Forces on verge of surrounding wide area north of Raqqa, spokesperson for fighters says'
  ,'Pentagon: US-backed coalition is carrying out air strikes to aid military advance toward Raqqa, Syria'
  ,'2 Birmingham, England, men sentenced to 5, 4, years jail after being found guilty of trying to travel to Syria to commit acts of terror, say police'
  ,'Turkish military say it has hit 71 Islamic State targets in operation in northern Syria'
  ,'Syrian state TV: Syrian rebels shell 1 of 8 evacuation corridors in Aleppo, hours after ceasefire entered into force'
  ,'Russia, US Army officials discuss additional safety measures for flights over Syria by Russian and US-led coalition planes - Reuters'
  ,'Russia\'s President Putin calls for a \'humanitarian pause\' in Syria\'s Aleppo on Friday'
]
*/

var switchDictionary = [
  {
    original: ['Syria', 'Syria,']
    ,switch: ['America']
  },
  {
    original: ['Syrian']
    ,switch: ['American']
  },
  {
    original: ['Aleppo', 'Aleppo,']
     ,switch: ['New York City', 'Los Angeles', 'Chicago', 'Houston', 'Washington, DC'] // Biggest US cities
    //,switch: ['Chicago', 'Houston'] // Cities closest in size to Aleppo
  },
  {
    original: ['Homs']
    ,switch: ['Montgomery, Al', 'Amarillo, TX', 'Little Rock, AR', 'Salt Lake City, UT']
  },
  {
    original: ['Damascus']
    ,switch: ['San Diego', 'Dallas', 'San Jose']
  },
  {
    original: ['Latakia']
    ,switch: ['Arlington, TX', 'New Orleans', 'Tampa, FL']
  },
  {
    original: ['Raqqa']
    ,switch: ['Richmond, VA', 'Boise, ID', 'San Bernardino', 'Des Moines', 'Rochester, NY']
  },
  {
    original: ['Iraq']
    ,switch: ['Canada', 'Mexico']
  },
  {
    original: ['Mosul']
    ,switch: ['Toronto', 'Mexico City']
  },
  {
    original: ['Trump']
    ,switch: ['Obama', 'Clinton']
  }
  {
    original: ["Trump's"]
    ,switch: ["Obama's", "Clinton's"]
  }
]

function chooseRandomHeadline() {
  return headlinesArray[Math.floor(Math.random() * headlinesArray.length)];
}

function switchWords(tweetString) {
  console.log('\noriginal string:', tweetString);
  var stringWordArray = tweetString.split(' ')

  //console.log('array: ', JSON.stringify(stringWordArray))

  _.each(stringWordArray, function(word,i){
    //console.log('word', word)

    if (_.find(switchDictionary, function(d){
      return _.find(d.original, function(k){
        return k == word
      })
    })) {
      //console.log('word to be switched! \n', word)

      var wordAlternatives = _.find(switchDictionary, function(d){
        return _.find(d.original, function(k){
          return k == word
        })
      })

      wordAlternatives = wordAlternatives.switch

      var newWord = wordAlternatives[Math.floor(Math.random() * wordAlternatives.length)]

      //console.log('alternatives:\n', JSON.stringify(wordAlternatives))
      //console.log('we pick:\n', newWord)

      stringWordArray[i] = newWord
    }
  })

  console.log('\nafter string:', stringWordArray.join(' '))

  return stringWordArray.join(' ')
}

getHeadlines()


function getHeadlines(){
  //var newsSources = ['associated-press']
  var newsSources = ['bbc-news', 'associated-press', 'reuters', 'the-new-york-times', 'the-washington-post', 'the-huffington-post']
  var keywords = []

  _.each(switchDictionary, function(switchy,i){
    _.each(switchy.original, function(switchword,i){
      keywords.push(switchword)
    })
  })

  _.each(newsSources, function(source,i){
    // Connect to newsAPI for each source
    var url = 'https://newsapi.org/v1/articles?source='+source+'&apiKey='+process.env.NEWS_API_KEY;
    console.log('Checking stories from', source)
    request(url, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        var newsStories = JSON.parse(body)
        console.log('Found '+newsStories.articles.length+' stories')
        //console.log('1st story title-->', newsStories.articles[0].title)
        var selectedNewsStories = _.filter(newsStories.articles, function(story,i){
          console.log('\nChecking story '+i)
          // Title = story.title
          // Description = story.description
          // URL = story.url
          var storyRelevant = false
          var storyTitle = story.title
          var storyTitleWordArray = storyTitle.split(' ')

          _.each(storyTitleWordArray, function(word,i){ // Go through every word in title
            // Check and see if that word is a keyword
            if (_.find(keywords, function(keyword,i){ return keyword == word })) {
              // if it is, story is relevant
              console.log("-> Keyword found: ", word)
              storyRelevant = true
            }
          })
          if (storyRelevant) {
            var newTweet = switchWords(story.title)// + ' (' + source+ ')'
            console.log('new tweet:',newTweet)
            Bot.tweet('BREAKING: '+newTweet);

          }
          // This return is used by the .filter but we don't really use it
          return storyRelevant
        })
      } // \if
    }) // \request
  }) // \each
}
