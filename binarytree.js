var BinaryTree = function(identifier)
{
  var self = this;
  this.identifier = identifier;

  var BNode = function(content)
  {
    var node = this;
    node.parent = null
    node.leftchild = null;
    node.rightchild = null;
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

  //SHOULDN'T BE CALLED FROM ANYWHERE BUT WITHIN A TREE!! (only public so other trees can call it... )
  self.insertNode = function(node)
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

  //SHOULDN'T BE CALLED FROM ANYWHERE BUT WITHIN A TREE!! (only public so other trees can call it... )
  self.removeNode = function(node)
  {
    var newSelf = findGreatestChildNode(node.left);
    if(node.parent)
    {
      var isLeft = false;
      if(node.parent.left == node)
        isLeft = true;
      else if(node.parent.right == node)
        isLeft = false;
    }
    node.prev.next = node.next;
    node.next.prev = node.prev;
    node.next = null;
    node.prev = null;
  
    if(node.content !== null)
    {
      delete node.content.RNodeMap[self.identifier];
    }
  
    return node;
  };

  self.register = function(content)
  {
    self.insertNodeAfter(new RNode(content), self.head);
  };
  
  self.unregister = function(content)
  {
    self.removeNode(content.RNodeMap[self.identifier]);
  };
  
  self.moveMemberToList = function(content, list)
  {
    list.insertNodeAfter(self.removeNode(content.RNodeMap[self.identifier]), list.head);
  };
  
  self.performMemberFunction = function(func, args)
  {
    var node = self.head;
    while(node.next != null)
    {
      node = node.next;
      if(node.prev.content !== null)
        node.prev.content[func](args);
    }
  };

  self.performOnMembers = function(func, args)
  {
    var node = self.head;
    while(node.next != null)
    {
      node = node.next;
      if(node.prev.content !== null)
        func(node.prev.content, args);
    }
  };

  self.firstMember = function()
  {
    return self.head.next.content;
  };

  self.empty = function()
  {
    var m;
    while(m = self.firstMember())
      self.unregister(m);
  };
};
  
RegistrationList.prototype.toString = function()
{
  var str = "";
  var node = this.head;
  var i = 0;
  while(node.next != null)
  {
    node = node.next;
    if(node.content !== null)
      str += node.content.toString()+",";
  }
  return str;
};

var PrioritizedRegistrationList = function(identifier, priorities)
{
  var self = this;
  this.identifier = identifier;
  this.priorities = [];
  for(var i = 0; i < priorities; i++)
    this.priorities[i] = new RegistrationList(identifier+"_PRIORITY_"+i);

  self.register = function(content, priority)
  {
    this.priorities[priority].register(content);
  };
  
  self.unregister = function(content, priority)
  {
    this.priorities[priority].unregister(content);
  };
  
  self.moveMemberToList = function(content, priority, list)
  {
    this.priorities[priority].moveMemberToList(content, list);
  };

  self.moveMemberToPrioritizedList = function(content, priority, list, priority)
  {
    this.priorities[priority].unregister(content);
    list.register(content, priority);
    //That's the fastest way I can think to do this one, unfortunately... :(
  };
  
  self.performMemberFunction = function(func, args)
  {
    for(var i = 0; i < this.priorities.length; i++)
      this.priorities[i].performMemberFunction(func, args);
  };
  
  self.performOnMembers = function(func, args)
  {
    for(var i = 0; i < this.priorities.length; i++)
      this.priorities[i].performOnMembers(func, args);
  };

  self.firstMember = function(priority)
  {
    return this.priorities[i].firstMember();
  };

  self.empty = function()
  {
    for(var i = 0; i < this.priorities.length; i++)
      this.priorities[i].empty();
  };
};
  
PrioritizedRegistrationList.prototype.toString = function()
{
  var str = "";
  for(var i = 0; i < this.priorities.length; i++)
    str += this.priorities[i].toString()+",";
  return str;
};

var RecycleRegistrationList = function(identifier, generateFunc, refreshFunc)
{
  var self = this;
  this.identifier = identifier;
  var active = new RegistrationList("RECYCLE_"+identifier+"_ACTIVE");
  var inactive = new RegistrationList("RECYCLE_"+identifier+"_INACTIVE");

  self.generate = generateFunc;
  self.refresh = refreshFunc;

  self.get = function()
  {
    var m;
    if(m = inactive.firstMember())
      inactive.unregister(m);
    else
      m = self.generate();
    self.refresh(m);
    return m;
  };

  self.add = function(m)
  {
    active.register(m);
  }
  
  self.retire = function(m)
  {
    active.moveMemberToList(m, inactive);
  }
  
  self.performMemberFunction = function(func, args)
  {
    active.performMemberFunction(func, args);
  };

  self.performOnMembers = function(func, args)
  {
    active.performOnMembers(func, args);
  };

  self.firstMember = function()
  {
    return active.firstMember();
  };

  self.empty = function()
  {
    var m;
    while(m = self.firstMember())
      self.retire(m);
  };
};
