const redis = require("redis");
const client = redis.createClient();
 
client.on("error", function(error) {
  console.error(error);
});
 
client.blpop('mylist',5,function(err,res){
    console.log(`reponse is ${res}`);
    console.log(`error is ${err}`);
    
})
