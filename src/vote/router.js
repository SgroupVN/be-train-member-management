const express = require('express');
const nested = require('nested-knex');
const { isLoggedIn } = require('../middlewares/auth');
const db = require('../database/knex-connection');

const router = express.Router();

// Seperate later
const voteResponseModel = nested.array(
  nested.type({
    id: nested.number('vote.id', { id: true }),
    title: nested.string('vote.voteTitle'),
    options: nested.array(
      nested.type({
        id: nested.number('voteOption.id'),
        title: nested.string('voteOption.optionTitle'),
        users: nested.array(nested.type({ id: nested.number('user.id'), username: nested.string('user.name') })),
      })
    ),
  })
);

// Create new vote
router.post('/', async (req, res) => {
  const { voteTitle, voteQuestion, options } = req.body;
  const isValid = Boolean(voteTitle !== undefined && voteQuestion !== undefined);

  if (isValid) {
    try {
      await db.transaction(async (trx) => {
        const ids = await trx('catalogues').insert({ voteTitle, voteQuestion, createdBy: 1 });

        // eslint-disable-next-line no-return-assign, prefer-destructuring, no-param-reassign
        options.forEach((option) => (option.voteId = ids[0]));
        await db('voteOption').insert(options).transacting(trx);

        return res.status(200).json({ message: `Add record success` });
      });
    } catch (error) {
      return res.status(500).json({ message: 'Error when connect to mysql' });
    }
  } else {
    return res.status(400).json({
      message: 'Please fill the required fields',
    });
  }
});

// Get vote detail
router.get('/:id', async (req, res) => {
  try {
    const records = await voteResponseModel.withQuery(
      db('vote')
        .join('voteOption', 'vote.id', '=', 'voteOption.voteId')
        .leftJoin('voteResult', 'voteOption.id', '=', 'voteResult.voteOptionId')
        .leftJoin('user', 'voteResult.userId', '=', 'user.id')
        .where('vote.id', req.params.id)
    );
    return res.json(records);
  } catch (error) {
    return res.status(500).json({ message: 'Error when connect to mysql' });
  }
});

// Get votes
router.get('/', async (req, res) => {
  try {
    const records = await voteResponseModel.withQuery(
      db('vote')
        .join('voteOption', 'vote.id', '=', 'voteOption.voteId')
        .leftJoin('voteResult', 'voteOption.id', '=', 'voteResult.voteOptionId')
        .leftJoin('user', 'voteResult.userId', '=', 'user.id')
    );
    return res.json(records);
  } catch (error) {
    return res.status(500).json({ message: 'Error when connect to mysql' });
  }
});

// Update vote
router.patch('/:id', async (req, res) => {
  const voteId = parseInt(req.params.id, 10);
  const { voteTitle, voteQuestion } = req.body;

  try {
    const vote = await db('vote').where('vote.id', voteId).first();
    if (!vote) {
      return res.status(404).json({
        message: 'vote could not be found',
      });
    }
    await db('vote').where({ id: voteId }).update({ voteTitle, voteQuestion }, ['voteTitle', 'voteQuestion']);
    return res.status(200).json({ message: 'Update success' });
  } catch (error) {
    return res.status(500).json({ message: 'Error when connect to mysql' });
  }
});

// Remove vote
router.delete('/:id', async (req, res) => {
  const voteId = parseInt(req.params.id, 10);

  try {
    const vote = await db('vote').where('vote.id', voteId).first();
    if (!vote) {
      return res.status(404).json({
        message: 'vote could not be found',
      });
    }
    const response = await db('vote').where({ id: voteId }).del();

    return res.json(response);
  } catch (error) {
    return res.status(500).json({ message: 'Error when connect to mysql' });
  }
});

// Add option
router.post('/:id/options', async (req, res) => {
  const { optionTitle } = req.body;
  const voteId = parseInt(req.params.id, 10);

  if (!optionTitle) {
    try {
      const vote = await db('vote').where('vote.id', voteId).first();
      if (!vote) {
        return res.status(404).json({
          message: 'Vote could not be found',
        });
      }

      const option = await db('voteOption').insert({ optionTitle, voteId });
      return res.json(option[0]);
    } catch (error) {
      return res.status(500).json({ message: 'Error when connect to mysql' });
    }
  } else {
    return res.status(400).json({
      message: 'Missing some stuffs bro',
    });
  }
});

// Update option
router.patch('/options/:optionId', async (req, res) => {
  const { optionTitle } = req.body;
  const optionId = parseInt(req.params.optionId, 10);

  if (!optionTitle) {
    try {
      const option = await db('voteOption').where('voteOption.id', optionId).first();
      if (!option) {
        return res.status(404).json({
          message: 'Option could not be found',
        });
      }

      await db('voteOption').where({ id: optionId }).update({ optionTitle }, ['optionTitle']);
      return res.json(option[0]);
    } catch (error) {
      return res.status(500).json({ message: 'Error when connect to mysql' });
    }
  } else {
    return res.status(400).json({
      message: 'Missing some stuffs bro',
    });
  }
});

// Remove option
router.delete('/options/:optionId', async (req, res) => {
  const optionId = parseInt(req.params.optionId, 10);

  try {
    const option = await db('voteOption').where('voteOption.id', optionId).first();
    if (!option) {
      return res.status(404).json({
        message: 'Option could not be found',
      });
    }
    const response = await db('voteOption').where({ id: option }).del();

    return res.json(response);
  } catch (error) {
    return res.status(500).json({ message: 'Error when connect to mysql' });
  }
});

// Submit vote
router.post('/submit/:optionid', isLoggedIn, async (req, res) => {
  const userId = 1;
  // const { userId } = req.userId;
  const { optionId } = req.params.optionid;

  try {
    await db('voteResult').insert({ optionId, userId });
    return res.status(200).json({ message: `Add record success` });
  } catch (error) {
    return res.status(500).json({ message: 'Error when connect to mysql' });
  }
});

// Un-submit vote
router.post('/un-submit/:optionid', isLoggedIn, async (req, res) => {
  const userId = 1;
  // const { userId } = req.userId;
  const { optionId } = req.params.optionid;

  try {
    const response = await db('voteResult').where({ optionId, userId }).del();
    return res.json(response);
  } catch (error) {
    return res.status(500).json({ message: 'Error when connect to mysql' });
  }
});

module.exports = router;
