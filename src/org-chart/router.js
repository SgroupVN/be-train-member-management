const express = require('express');

const db = require('../database/connection');
const { getMany, create, getOne, updateOne, deleteOne, updateMany } = require('../database/query');
const { transformArrayToTree } = require('../utilities/array-to-tree');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const organizationTreeNodes = await getMany({
      db,
      query: `SELECT child.id AS memberId,
        parent.id AS managerId,
        mb.first_name AS firstName,
        mb.last_name AS lastName,
        mb.phone_number AS phoneNumber,
        mb.email AS memberEmail,
        mb.age AS memberAge,
        dp.name AS departmentName,
        dp.id AS departmentId,
        dp.description AS departmentDescription,
        ps.title AS positionTitle,
        CASE 
          WHEN dp.id IS NOT NULL THEN 'department'
          ELSE 'member'
        END AS nodeType
  
      FROM org_tree_nodes child
  
      LEFT JOIN org_tree_nodes parent ON child.parent_id = parent.id
      LEFT JOIN member_position mp ON mp.id = child.member_position_id
      LEFT JOIN members mb ON mp.member_id = mb.id
      LEFT JOIN positions ps ON mp.position_id = ps.id
      LEFT JOIN departments dp ON dp.id = child.department_id;`,
    });

    const buildNodeDescription = (node) => {
      if (node.nodeType === 'department') {
        return {
          ...node,
          description: `${node.departmentDescription}`,
        };
      }

      return {
        ...node,
        description: `name: ${`${node.firstName} ${node.lastName}`}\nage: ${node.memberAge}\nemail: ${node.memberEmail}`,
      };
    };

    const tree = transformArrayToTree({
      nodes: organizationTreeNodes,
      extensions: [buildNodeDescription],
    });

    return res.json({
      data: tree,
      message: 'success',
    });
  } catch (error) {
    return res.status(500).json({
      message: 'internal server error',
    });
  }
});

router.post('/nodes', async (req, res) => {
  try {
    const { parentId, memberPositionId, departmentId, nodeType } = req.body;

    const parentNode = await getOne({
      db,
      query: 'SELECT * FROM org_tree_nodes WHERE id = ?',
      params: [parentId],
    });

    if (!parentNode) {
      return res.status(400).json({
        success: false,
        message: 'Parent node not found',
      });
    }

    const query = `
      INSERT INTO org_tree_nodes(parent_id, member_position_id, department_id)
      VALUES (?, ?, ?)
    `;

    const orgTreeNode = await create({
      db,
      query,
      params: [parentId, memberPositionId, departmentId, nodeType],
    });

    return res.status(200).json({
      success: true,
      ...orgTreeNode,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

router.delete('/nodes/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const currentTreeNode = await getOne({
      db,
      query: 'SELECT * FROM org_tree_nodes WHERE id = ?',
      params: [id],
    });

    if (!currentTreeNode) {
      return res.status(400).json({
        success: false,
        message: 'Node not found',
      });
    }

    const childNodes = await getMany({
      db,
      query: `SELECT * FROM org_tree_nodes WHERE parent_id = ?`,
      params: [id],
    });

    const childNodeIds = childNodes.map((childNode) => childNode.id);

    await updateMany({
      db,
      query: 'PDATE org_tree_nodes SET parent_id = ? WHERE id IN (?)',
      params: [currentTreeNode.parent_id, childNodeIds],
    });

    await deleteOne({
      db,
      query: 'DELETE FROM org_tree_nodes WHERE id = ?',
      params: [currentTreeNode.id],
    });

    return res.status(200).json({
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

module.exports = router;
