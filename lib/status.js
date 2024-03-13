'use strict';

var Common = require('./common');

function StatusController(node) {
  this.node = node;
  this.common = new Common({log: this.node.log});
}

StatusController.prototype.show = function(req, res) {
  var self = this;
  var option = req.query.q;

  switch(option) {
  case 'getDifficulty':
    this.getDifficulty(function(err, result) {
      if (err) {
        return self.common.handleErrors(err, res);
      }
      res.jsonp(result);
    });
    break;
  case 'getLastBlockHash':
    res.jsonp(this.getLastBlockHash());
    break;
  case 'getBestBlockHash':
    this.getBestBlockHash(function(err, result) {
      if (err) {
        return self.common.handleErrors(err, res);
      }
      res.jsonp(result);
    });
    break;
  case 'getMiningInfo':
    this.getMiningInfo(function(err, result) {
        if (err) {
            return self.common.handleErrors(err, res);
        }
        res.jsonp({
			    miningInfo: result
		    });
    });
	  break
  case 'getPeerInfo':
    this.getPeerInfo(function(err, result) {
        if (err) {
            return self.common.handleErrors(err, res);
        }
        res.jsonp({
          peerInfo: result
        });
    });
    break;
  case 'getInfo':
  default:
    this.getInfo(function(err, result) {
      if (err) {
        return self.common.handleErrors(err, res);
      }
      res.jsonp({
        info: result
      });
    });
  }
};

StatusController.prototype.getInfo = function(callback) {
  this.node.services.aidpd.getInfo(function(err, result) {
    if (err) {
      return callback(err);
    }
    var info = {
      version: result.version,
      protocolversion: result.protocolVersion,
      walletversion: result.walletversion,
      blocks: result.blocks,
      timeoffset: result.timeOffset,
      connections: result.connections,
      proxy: result.proxy,
      difficulty: result.difficulty,
      testnet: result.testnet,
      relayfee: result.relayFee,
      errors: result.errors,
      network: result.network,
      reward: result.reward
    };
    callback(null, info);
  });
};

StatusController.prototype.getMiningInfo = function(callback) {
  this.node.services.aidpd.getMiningInfo(function(err, result) {
    if (err) {
      return callback(err);
    }
	var miningInfo = {
	  difficulty: result.difficulty,
	  networkhashps: result.networkhashps
	};
	callback(null, miningInfo);
  });
};

StatusController.prototype.getPeerInfo = function(callback) {
  this.node.services.aidpd.getPeerInfo(function(err, response) {
    if (err) {
      return callback(err);
    }
  var peers = [];
  var date_now = new Date();
  response.result.forEach(function (obj) {

     var date_past = new Date(obj.conntime*1000);
     var seconds = Math.floor((date_now - (date_past))/1000);
     var minutes = Math.floor(seconds/60);
     var hours = Math.floor(minutes/60);
     var days = Math.floor(hours/24);

     hours = hours-(days*24);
     minutes = minutes-(days*24*60)-(hours*60);
     seconds = seconds-(days*24*60*60)-(hours*60*60)-(minutes*60);

      peers.push({
        address: obj.addr.split(':')[0],
        protocol: obj.version,
        version: obj.subver.replace('/', '').replace('/', ''),
        uptime: {
          Days: days,
          Hours:hours,
          Minutes: minutes,
          Seconds: seconds,
        },
        timestamp: obj.conntime
      });
  });
  peers.sort(function(a,b){
    return a.timestamp - b.timestamp;
  });
	callback(null, peers);
  });
};

StatusController.prototype.getLastBlockHash = function() {
  var hash = this.node.services.aidpd.tiphash;
  return {
    syncTipHash: hash,
    lastblockhash: hash
  };
};

StatusController.prototype.getBestBlockHash = function(callback) {
  this.node.services.aidpd.getBestBlockHash(function(err, hash) {
    if (err) {
      return callback(err);
    }
    callback(null, {
      bestblockhash: hash
    });
  });
};

StatusController.prototype.getDifficulty = function(callback) {
  this.node.services.aidpd.getInfo(function(err, info) {
    if (err) {
      return callback(err);
    }
    callback(null, {
      difficulty: info.difficulty
    });
  });
};

StatusController.prototype.sync = function(req, res) {
  var self = this;
  var status = 'syncing';

  this.node.services.aidpd.isSynced(function(err, synced) {
    if (err) {
      return self.common.handleErrors(err, res);
    }
    if (synced) {
      status = 'finished';
    }

    self.node.services.aidpd.syncPercentage(function(err, percentage) {
      if (err) {
        return self.common.handleErrors(err, res);
      }
      var info = {
        status: status,
        blockChainHeight: self.node.services.aidpd.height,
        syncPercentage: Math.round(percentage),
        height: self.node.services.aidpd.height,
        error: null,
        type: 'aidpcore node'
      };

      res.jsonp(info);

    });

  });

};

// Hard coded to make insight ui happy, but not applicable
StatusController.prototype.peer = function(req, res) {
  res.jsonp({
    connected: true,
    host: '127.0.0.1',
    port: null
  });
};

StatusController.prototype.version = function(req, res) {
  var pjson = require('../package.json');
  res.jsonp({
    version: pjson.version
  });
};

module.exports = StatusController;
