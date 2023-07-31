const express = require( 'express' );
const router = express.Router();
const {
    createRecord, getRecords, getRecord, updateRecord, deleteRecord,
} = require( '../controllers/recordController' )
const {userAuth} = require( '../middlewares/authmiddleware')
    
router.post( "/record", userAuth, createRecord );
router.get( "/record", userAuth, getRecords );
router.get( "/record/:id", userAuth, getRecord );
router.put( "/record/:id", userAuth, updateRecord );
router.delete( "/record/:id", userAuth, deleteRecord );


module.exports = router;