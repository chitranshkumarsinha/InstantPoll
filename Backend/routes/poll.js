import express from 'express'
import auth from '../middleware/auth.js'
import { CastVote, check_email, CreatePoll, vote } from '../controllers/poll_controller.js';

const router = express.Router();

router.post('/:id/check-email',check_email)
router.post('/create',auth,CreatePoll)
router.post('/:id/vote',vote)
router.get('/:code',CastVote)

export default router