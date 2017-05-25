var User = require('../models/user');
var Message = require('../models/message');

module.exports = (app) =>{
    app.get('/discussion',isLoggedIn,(req,res)=>{
        Message.find({},(err,result)=>{
            console.log('listening ........discussion');
            console.log('result',result);
            res.render('user/discussion',{title:'discussion', user:req.user, data:result});
        });//return array, if want to use find method without any criteria, passing the empty array. the found data will be saved in data      
    });
    
    app.post('/discussion',(req,res)=>{  
      
        var newMessage = new Message();
        newMessage.userFrom = req.user._id;
        newMessage.userFromName = req.user.fullname;
        newMessage.body = req.body.mes1;
        newMessage.createdAt = new Date();

        console.log('newMessage',newMessage);

        newMessage.save((err)=>{
            res.redirect('/discussion');
        });

    });
}

function isLoggedIn(req,res,next){
    if(req.isAuthenticated()){
        next();
    }else{
        res.redirect('/');
    }
}