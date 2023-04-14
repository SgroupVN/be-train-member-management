const transformArrayToTree = ({ nodes, extensions }) => {
  const map = {};
  const roots = [];

  nodes.forEach((node) => {
    let nodeTransformed;

    extensions.forEach((extension) => {
      nodeTransformed = extension(node);
    });

    const { nodeType: type, ...data } = nodeTransformed;

    map[node.memberId] = { type, data, expanded: true, children: [] };
  });

  nodes.forEach((node) => {
    if (node.managerId) {
      map[node.managerId].children.push(map[node.memberId]);
    } else {
      roots.push(map[node.memberId]);
    }
  });

  return roots;
};

module.exports = {
  transformArrayToTree,
};
