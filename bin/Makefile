configure-kubectl:
	@echo "\n*"
	@echo "* CONFIGURE KUBECTL "
	@echo "*\n"
	kubectl config set-cluster master --server=http://$(MASTER_SERVER):8080
	kubectl config set-context master --cluster=master
	kubectl config use-context master
	kubectl get nodes

configure: configure-kubectl
