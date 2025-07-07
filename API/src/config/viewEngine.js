const path=require('path')
const express=require('express')


const viewEngine=(app)=>{
    app.set('views', path.join(__dirname, '../views'));
    app.set('view engine', 'pug');
    app.use("/images",express.static(path.join(__dirname, '../public/images/')));
    app.use(express.json());
app.use(express.urlencoded({ extended: true }))
}

module.exports=viewEngine