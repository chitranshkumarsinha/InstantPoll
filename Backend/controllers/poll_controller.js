import pool from '../db.js';

// Helper to generate a 6-character random alphanumeric code
const generateSecretCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

// @route   POST /api/polls/create
// @desc    Create a new poll with options
// @access  Private (Requires JWT)
export const CreatePoll= async (req, res) => {
    const { question, options, isPublic, hoursUntilExpire = 24 } = req.body;

    if (!question || !options || options.length < 2) {
        return res.status(400).json({ error: 'Question and at least two options are required' });
    }

    try {
        // Calculate expiration timestamp
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + hoursUntilExpire);

        // Generate a unique code
        let secretCode = generateSecretCode();
        let isUnique = false;

        // Ensure code doesn't already exist in the DB
        while (!isUnique) {
            const check = await pool.query('SELECT id FROM polls WHERE secret_code = $1', [secretCode]);
            if (check.rows.length === 0) isUnique = true;
            else secretCode = generateSecretCode(); // Try again if taken
        }

        // Start SQL Transaction
        await pool.query('BEGIN');

        // 1. Insert the Poll
        const newPoll = await pool.query(
            `INSERT INTO polls (creator_id, question, secret_code, is_public, expires_at)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [req.user, question, secretCode, isPublic || false, expiresAt]
        );

        const pollId = newPoll.rows[0].id;

        // 2. Insert the Options dynamically
        // We build a single query like: INSERT INTO poll_options (poll_id, text) VALUES ($1,$2), ($3,$4)...
        const optionValues = [];
        const queryPlaceholders = [];
        let placeholderIndex = 1;

        options.forEach(option => {
            queryPlaceholders.push(`($${placeholderIndex++}, $${placeholderIndex++})`);
            optionValues.push(pollId, option);
        });

        const optionsQuery = `INSERT INTO poll_options (poll_id, option_text) VALUES ${queryPlaceholders.join(', ')} RETURNING *`;
        const newOptions = await pool.query(optionsQuery, optionValues);

        // Commit Transaction
        await pool.query('COMMIT');

        res.json({
            message: "Poll created successfully",
            poll: newPoll.rows[0],
            options: newOptions.rows
        });

    } catch (err) {
        // If anything goes wrong, rollback all changes
        await pool.query('ROLLBACK'); 
        console.error(err.message);
        res.status(500).json({ error: 'Server Error' });
    }
}

export const CastVote = async (req, res) => {
    try {
        // 1. Clean the input code
        const secretCode = req.params.code.toUpperCase();

        // 2. Find the poll
        const pollResult = await pool.query(
            'SELECT id, question, expires_at, is_public FROM polls WHERE secret_code = $1',
            [secretCode]
        );

        if (pollResult.rows.length === 0) {
            return res.status(404).json({ error: 'Poll not found or invalid code' });
        }

        const poll = pollResult.rows[0];

        // 3. Check if the poll has expired
        const now = new Date();
        const expiresAt = new Date(poll.expires_at);
        
        if (now > expiresAt) {
            return res.status(403).json({ error: 'This poll has expired and is no longer accepting votes' });
        }

        // 4. Fetch the options for this poll
        const optionsResult = await pool.query(
            'SELECT id, option_text FROM poll_options WHERE poll_id = $1 ORDER BY id ASC',
            [poll.id]
        );

        // 5. Send data to the frontend
        res.json({
            poll: {
                id: poll.id,
                question: poll.question,
                expiresAt: poll.expires_at,
                isPublic: poll.is_public
            },
            options: optionsResult.rows
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server Error' });
    }
}

export const check_email = async (req, res) => {
    const { email } = req.body;
    const pollId = req.params.id;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    try {
        const voteCheck = await pool.query(
            'SELECT id FROM votes WHERE poll_id = $1 AND voter_email = $2',
            [pollId, email]
        );

        // If a row is found, they have already voted
        const hasVoted = voteCheck.rows.length > 0;
        
        res.json({ hasVoted });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server Error' });
    }
}

export const vote = async (req, res) => {
    const { email, optionId } = req.body;
    const pollId = req.params.id;

    if (!email || !optionId) {
        return res.status(400).json({ error: 'Email and Option ID are required' });
    }

    try {
        // Attempt to insert the vote
        await pool.query(
            'INSERT INTO votes (poll_id, option_id, voter_email) VALUES ($1, $2, $3)',
            [pollId, optionId, email]
        );

        res.json({ message: 'Vote successfully cast!' });

    } catch (err) {
        // '23505' is the Postgres code for unique_violation
        if (err.code === '23505') {
            return res.status(403).json({ error: 'This email has already voted on this poll.' });
        }
        
        console.error(err.message);
        res.status(500).json({ error: 'Server Error' });
    }
}