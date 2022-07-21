const mongoClient=require('mongodb').MongoClient

const state={
    db:null
}

module.exports.connect=function(done){
    const url='mongodb+srv://arunsankar:KNEbtv9zXo1yWW3h@veggefoods.rqra6kg.mongodb.net/?retryWrites=true&w=majority'
    const dbname='signup'
    


mongoClient.connect(url,(err,data)=>{

    if(err) return done(err)
    state.db=data.db(dbname)
    done()
})
}


module.exports.get= ()=>{ return state.db
}

  
