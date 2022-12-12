var ImovelRegistry = artifacts.require("ImovelRegistry");

const prop_owner = '0x9f5EA93DcC878578244c8a56eE5CA0d8B70D288E';

module.exports = async function (deployer) {
    // deployment steps
    await deployer.deploy(ImovelRegistry, "Registro Brasileiro de Imóveis", 4674);
    const registry = await ImovelRegistry.deployed();
};