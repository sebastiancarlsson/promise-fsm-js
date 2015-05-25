var PromiseFSMModule = angular.module("PromiseFSMModule", []);
PromiseFSMModule.service("PromiseFSM", ["$q", function ($q) {

%code%

	PromiseFSM.setPromiseAdapter($q);

	return PromiseFSM;
}]);