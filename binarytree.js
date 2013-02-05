var BinaryTree = function(identifier)
{
  var self = this;
  this.identifier = identifier;

  var BNode = function(content)
  {
    var node = this;
    node.parent = null
    node.left = null;
    node.right = null;
    node.content = content;

    if(node.content !== null && typeof node.content.BNodeMap === 'undefined')
    {
      Object.defineProperty(node.content, "BNodeMap", {
        enumerable:false,
        configurable:true,
        writable:true,
        value:{}
      });
    }
  };
  BNode.prototype.isALeaf = function() { if(this.left == null && this.right == null) return true; else return false; };
  BNode.prototype.isAHead = function() { if(this.parent == null) return true; else return false; };
  BNode.prototype.isLeftChild = function() { if(this.parent.left == this) return true; else if(this.parent.right == this) return false; };
  BNode.prototype.numChildren = function() { var num = 0; if(this.left != null) num++; if(this.right != null) num++; return num; };

  this.head = null;

  var findGreatestChildNode = function(head)
  {
    var tmp;
    while(tmp = head.right)
      head = tmp;
    return head;
  };

  var findLeastChildNode = function(head)
  {
    var tmp;
    while(tmp = head.left)
      head = tmp;
    return head;
  };

  var insertNode = function(node)
  {
    var parentNode = null;
    var tmpNode = head;
    var evaluation = node.evaluate();
    var tmpEvaluation = 0;
    var lastCheckWasLeft = false;
    //Non-recursive tree traversal
    while(tmpNode)
    {
      if(tmpNode) tmpEvaluation = tmpNode.evaluate();
      while(tmpNode && evaluation < tmpEvaluation)
      {
        parentNode = tmpNode;
        tmpNode = parentNode.left;
        lastCheckWasLeft = true;
      }
      if(tmpNode) tmpEvaluation = tmpNode.evaluate();
      while(tmpNode && evaluation >= tmpEvaluation)
      {
        parentNode = tmpNode;
        tmpNode = parentNode.right;
        lastCheckWasLeft = false;
      }
    }
    node.parent = parentNode;
    if(parentNode && lastCheckWasLeft)
      parentNode.left = node;
    if(parentNode && lastCheckWasRight)
        parentNode.right = node;

    node.content.BNodeMap[self.identifier] = node;
  };

  var moveContentToNode = function(fromNode, toNode) //overwrites toNode's content
  {
    toNode.content = fromNode.content;
    toNode.content.BNodeMap[self.identifier] = toNode;
    fromNode.content = null;
  };

  var removeNode = function(node) //turned out that a potentially recursive algorithm was just o(1)...? did I do something wrong?
  {
    delete node.content.BNodeMap[self.identifier];

    if(node.numChildren == 2)
    {
      var newNodeToDelete = findGreatestChildNode(node.left);
      moveContentToNode(newNodeToDelete, node);
      node = newNodeToDelete;
    }

    var child = null;
    if(node.left != null) 
      child = node.left;
    else if(node.right != null)
      child = node.right;

    if(node.isLeftChild()) 
      node.parent.left = child;
    else
      node.parent.right = child;

    if(child)
      child.parent = node.parent;
  
    return node;
  };

  self.add = function(content)
  {
    self.insertNode(new RNode(content));
  };
  
  self.remove = function(content)
  {
    self.removeNode(content.RNodeMap[self.identifier]);
  };

  self.popBiggest = function()
  {
    return self.removeNode(self.findGreatestChildNode(head)).content;
  };

  self.popSmallest = function()
  {
    return self.removeNode(self.findLeastChildNode(head)).content;
  };

  //recursive. sorry.
  var appendChildrenAndSelfContentToOrderedList(node, list)
  {
    if(!node) return;
    appendChildrenAndSelfToOrderedList(node.left, list);
    list[list.length] = node.content;
    appendChildrenAndSelfToOrderedList(node.right, list);
  };

  self.getOrderedList = function()
  {
    var list = [];
    appendChildrenAndSelfContentToOrderedList(head, list);
    return list;
  };
};
