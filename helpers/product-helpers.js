const { promise, reject } = require('bcrypt/promises')
var db=require('../config/connection')
var collection=require('../config/collection')
const async = require('hbs/lib/async')
const { response } = require('../app')
const objectId=require('mongodb').ObjectId
module.exports={
    addProduct:(product,callback)=>{
        db.get().collection('product').insertOne(product).then((data)=>{
        
        callback(data.insertedId)
        })

    },
    getAllproducts:()=>{

        return new Promise(async(resolve,reject)=>{
            let products=await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            resolve(products)

        })

    },
    deleteproduct:(proId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).remove({_id:objectId(proId)}).then((response)=>{
                console.log(response)
                resolve(response)
            })
        })
    },
    getProductDetails:(proId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objectId(proId)}).then((product)=>{
                console.log(product)
                resolve(product)
            })    
        })
    },
    updateProduct:(proId,proDetails)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:objectId(proId)},
            {$set:{
                    name:proDetails.name,
                    price:proDetails.price,
                    category:proDetails.category,
                   description:proDetails.description
               }
            }).then((response)=>{
                resolve()
            })
        })
    },
    addCategory:(data)=>{
        return new Promise(async(resolve,reject)=>{
            console.log(data.category);
            let response={}
            let cat=await db.get().collection(collection.CATEGORY_COLLECTION).findOne({category:data.category})
            
            console.log(cat);
            if(cat){
                response.status=true
                response.category=cat.category
                resolve(response)
            }else{
                db.get().collection(collection.CATEGORY_COLLECTION).insertOne(data).then(()=>{
               response.status=false
               response.category=data.category
                resolve(response)
            })
        }
            

        })

    },
    getCategory:()=>{
        return new Promise(async(resolve,reject)=>{
            let category=await db.get().collection(collection.CATEGORY_COLLECTION).find().toArray()
            resolve(category)

        })

    },
    deletecategory:(catId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.CATEGORY_COLLECTION).remove({_id:objectId(catId)}).then((response)=>{
                console.log(response)
                resolve(response)
            })
        })
    },
    updateCategory:(catId,catDetails)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.CATEGORY_COLLECTION).updateOne({_id:objectId(catId)},
            {$set:{
                    category:catDetails.category
        
               }
            }).then((response)=>{
                resolve()
            })
        })
    },
    editGetCategory:(catId)=>{
        return new Promise(async(resolve,reject)=>{
            let cat=await db.get().collection(collection.CATEGORY_COLLECTION).findOne({_id:objectId(catId)})
            resolve(cat)

        })

    },

    addProductOffers:(offer)=>{
        // db.get().collection(collection.OFFER_COLLECTION).createIndex( { "offer.exp-date": 1 }, { expireAfterSeconds: 120 } )
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.OFFER_COLLECTION).insertOne(offer).then(()=>{
                resolve(offer)
            })
        })
    },
    viewProductOffers:()=>{
        return new Promise(async(resolve,reject)=>{
          let offer=await db.get().collection(collection.OFFER_COLLECTION).find().toArray()
          resolve(offer)
        })
    },
    applyProductOffer:(proId,offerId)=>{
        console.log('proooooo');
        console.log(proId);
        console.log(offerId);
        return new Promise(async(resolve,reject)=>{
            let product=await db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objectId(proId)})
            console.log('zszzsszszs');
            console.log(product);
            let offer=await db.get().collection(collection.OFFER_COLLECTION).findOne({_id:objectId(offerId)})
            console.log('offerrrrrrr');
            console.log(offer);
            product=parseInt(product.price)
            offer=(offer.offerpercent)
            applyoffer=(product*offer)/100
            newPrice=(product-applyoffer)
         db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:objectId(proId)},
            {
              $set:{
                  disPrice:newPrice,
                  status:true
              }  
            }).then(()=>{
                resolve()
            })
 })
    },
    removeProductOffer:(proId)=>{

        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:objectId(proId)},
            {
                $unset:{
                    status:'0',
                    disPrice:'0'
                }

            }).then(()=>{
                resolve()
            })
        })

    },
    addCoupon:(coupon)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.COUPON_COLLECTION).insertOne(coupon).then(()=>{
                resolve()
            })

        })

    },
    viewCoupon:()=>{
        return new Promise(async(resolve,reject)=>{
       let coupons= await db.get().collection(collection.COUPON_COLLECTION).find().toArray()
                resolve(coupons)
        

        })
    },
    removeCouponOffer:(userId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.USER_COLLECTION).updateOne({_id:objectId(userId)},
            {
                $unset:{
                    coupon:'0',
                    

                }
            }).then(()=>{
                resolve()
            })
        })

        console.log('userrrrrrrrrr');
        console.log(userId);

    },
    addBanners:(banner,callback)=>{
        db.get().collection(collection.BANNER_COLLECTION).insertOne(banner).then((data)=>{
        
            callback(data.insertedId)
            })

    },
    getAllbanners:()=>{
        return new Promise(async(resolve,reject)=>{
            let ban=await db.get().collection(collection.BANNER_COLLECTION).find().toArray()
            resolve(ban)
        })
    },

    removeBanner:(banId)=>{
        console.log('baaaaaaaaaaaan');
        console.log(banId);
        return new Promise(async(resolve,reject)=>{
          await db.get().collection(collection.BANNER_COLLECTION).deleteOne({_id:objectId(banId)}).then(()=>{
                resolve()
            })

        })
    },
    updateBanner:(banId,banDetails)=>{
        return new Promise(async(resolve,reject)=>{
            await db.get().collection(collection.BANNER_COLLECTION).updateOne({_id:objectId(banId)},{
                $set:{
                   bname:banDetails.bname,
                    cap:banDetails.cap
                }
            }).then(()=>{
                resolve()
            })
        })

    },
    addCatOffer:(offer)=>{
        console.log('44444444444444');
        console.log(offer);
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.CATOFFER_COLLECTION).insertOne(offer).then((response)=>{
                resolve(response)
            })
        })

    },
    getDailySales: () => {
        return new Promise(async (resolve, reject) => {
    
          let Dailysales = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
            {
              $match: {
                "status": { $nin: ['cancelled', 'pending'] }
              }
            },
            {
              $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$time" } },
                total: { $sum: '$totalAmount' },
                count: { $sum: 1 },
              }
            },
            {
              $sort: { _id: 1 },
            }
          ]).toArray()
          resolve(Dailysales)
        })
      },
      getMonthlySales: () => {
        return new Promise(async (resolve, reject) => {
    
          let Monthlysales = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
            {
              $match: {
                "status": { $nin: ['cancelled', 'pending'] }
              }
            },
            {
              $group: {
                _id: { $dateToString: { format: "%Y-%m", date: "$time" } },
                total: { $sum: '$totalAmount' },
                count: { $sum: 1 },
              }
            },
            {
              $sort: { _id: 1 },
            }
          ]).toArray()
          resolve(Monthlysales)
        })
      },
      getYearlySales: () => {
        return new Promise(async (resolve, reject) => {
    
          let yearsales = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
            {
              $match: {
                "status": { $nin: ['cancelled', 'pending'] }
              }
            },
            {
              $group: {
                _id: { $dateToString: { format: "%Y", date: "$time" } },
                total: { $sum: '$totalAmount' },
                count: { $sum: 1 },
              }
            },
            {
              $sort: { _id: 1 },
            }
          ]).toArray()
          resolve(yearsales)
        })
      },
    applySeasonalOffer:(season)=>{
        console.log(season);
        let seOffer={
            season,
            Date:new Date()
        }
        db.get().collection(collection.SEASONAL_COLLECTION).createIndex( { "Date": 1 }, { expireAfterSeconds: 3600 } )
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.SEASONAL_COLLECTION).insertOne(seOffer).then(()=>{
                resolve()
            })

        })

    },
    getSeasonalOffer:()=>{
        return new Promise(async(resolve,reject)=>{
   let seso=await  db.get().collection(collection.SEASONAL_COLLECTION).find().toArray()
   resolve(seso)
        })
    },

    applySeason:(offerId)=>{
        console.log(offerId);
        return new Promise(async(resolve,reject)=>{
            let sOffer=await db.get().collection(collection.SEASONAL_COLLECTION).findOne({_id:objectId(offerId)})
            if(sOffer){
                
                let product=await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
                console.log('ssssssssss');
                console.log(product);
                let price=await db.get().collection(collection.PRODUCT_COLLECTION).aggregate([
                   
                    
                    {
                       $project:{
                           proPrice:'$price'
                           } 
                    }
                    
                    
                 
                ]).toArray()
                console.log('00000000000000000');
                console.log(price);
                console.log(sOffer.season.offerpercent);
                sesOffer=sOffer.season.offerpercent
              
let sesPrice = price.map(myFunction)

function myFunction(price) {
  return price-6;
}
console.log(sesPrice);

            }
            

        })

    },
    addMoneyAdmin:(adminId,amount)=>{
        amound=parseInt(amount)
        return new Promise(async(resolve,reject)=>{
            let admin= await db.get().collection(collection.ADMIN_CRED).findOne({_id:objectId(adminId)})
            if(admin.wallet){
                db.get().collection(collection.ADMIN_CRED).updateOne({_id:objectId(adminId)},
                {
                    $inc:{wallet:amound}
                }).then(()=>{
                    resolve()
                })
                

            }else{
                db.get().collection(collection.ADMIN_CRED).updateOne({_id:objectId(adminId)},
                    {$set:{wallet:amound}},
                {

                }).then(()=>{
                    resolve()
                })
                
            }
            
          
        })
    },
    getAdminData:()=>{
        return new Promise(async(resolve,reject)=>{
            let adminData= await db.get().collection(collection.ADMIN_CRED).findOne()
            resolve(adminData)
        })
    }

    
    



  

}