import { useCallback, useEffect, useRef, useState } from "react";

import "./App.css";

// Bootstrap
import { Card, Form, Row, Col, Button, Toast, ToastContainer } from "react-bootstrap";
import { useSDK } from "@metamask/sdk-react";

// Components
import Loading from "./components/loading";

//web3
import { Web3 } from "web3";

//ABI
import bridgeAbi from "./bscBridgeContractABI.json";
import bscTokenAbi from "./bscTokenContractABI.json";
function App() {
  const [loading, setLoading] = useState(false);
  const [loadingLabel, setLoadingLabel] = useState("");

  const [toastVisible, setToastVisible] = useState(false);
  const [toastType, setToastType] = useState("light");
  const [toastTitle, setToastTitle] = useState("");
  const [toastContent, setToastContent] = useState("");

  const [bscTokenContract, setBscTokenContract] = useState(null);
  const [bscBridgeContract, setBscBridgeContract] = useState(null);

  const [hecoTokenContract, setHecoTokenContract] = useState(null);
  const [hecoBridgeContract, setHecoBridgeContract] = useState(null);
  const [amount, setAmount] = useState("300");

  const account = useRef(null);

  const { sdk, connected, connecting, provider, chainId } = useSDK();
  // const web3 = new Web3(new Web3.providers.HttpProvider("https://data-seed-prebsc-1-s1.binance.org:8545"));
  // console.log(window.web3.currentProvider)
  const web3 = new Web3(window.web3?.currentProvider);

  const connectMetamask = useCallback(
    (cb) => {
      setLoading(true);
      setLoadingLabel("Connecting to Metamask...");
      sdk
        ?.connect()
        .then((accounts) => {
          setLoading(false);
          setToastVisible(true);
          setToastType("success");
          setToastTitle("Connet Metamask");
          setToastContent("Succeed");
          account.current = accounts?.[0];
          cb();
        })
        .catch((error) => {
          setLoading(false);
          setLoadingLabel("");
          setToastVisible(true);
          setToastType("danger");
          setToastTitle("Connet Metamask");
          setToastContent(error.message);
          console.warn("failed to connect..", error);
        });
    },
    [sdk]
  );

  async function convertTokenToWei(tokenContract, amount) {
    try {
      // Get the number of decimals for the token
      const decimals = await tokenContract.methods.decimals().call();
      console.log(`Token Decimals: ${decimals}`);

      // Convert the amount to Wei
      const amountInWei = web3.utils.toNumber(amount).mul(web3.utils.toNumber(10).pow(web3.utils.toNumber(decimals)));
      console.log(`Amount in Wei: ${amountInWei.toString()}`);

      return amountInWei;
    } catch (error) {
      console.error("Error converting token to Wei:", error.message);
    }
  }

  useEffect(() => {
    if (web3) {
      const bscContractAddress = "0x380694e9884E0Ad07b45a44Ed8F8920a5609fBE5";

      const bscTokenContractInstatnce = new web3.eth.Contract(bscTokenAbi, bscContractAddress);
      setBscTokenContract(bscTokenContractInstatnce);
      setBscBridgeContract(new web3.eth.Contract(bridgeAbi, "0xc371d54583a9f7A1E3c6AAB329A7f0daE2274Dc4"));
    }
  }, []);

  const swap = useCallback(async () => {
    if (!account.current) {
      connectMetamask(() => {
        swap();
      });
      return;
    }

    const spender = "0xc371d54583a9f7A1E3c6AAB329A7f0daE2274Dc4"; // Spender's address
    // Assuming amount is the number of tokens you want to approve
    console.log(spender);
    try {
      const chainId = await window.ethereum.request({ method: "eth_chainId" });
      const bscChainId = "0x61"; // Hexadecimal for 128, the chain ID for HECO mainnet

      if (chainId !== bscChainId) {
        // Request to switch to HECO mainnet
        setLoading(true);
        setLoadingLabel("Switching Chain...");
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: bscChainId }],
        });
        setLoading(false);
        setLoadingLabel("");
      }

      setLoading(true);
      setLoadingLabel("Deposit in progress...");

      let remaining = await bscTokenContract?.methods.allowance(account.current, spender).call();
      remaining = web3.utils.fromWei(remaining, "ether");

      if (remaining < amount) {
        await bscTokenContract?.methods.approve(spender, web3.utils.toWei(amount, "ether")).send({ from: account.current });
        console.log("Approval successful");
      }

      // await convertTokenToWei(bscTokenContract, amount);

      await bscBridgeContract?.methods.addLiquidity(web3.utils.toWei(amount, "ether")).send({ from: account.current });
      console.log("add successfully");

      setLoading(false);
      setLoadingLabel("");

      const hecoChainId = "0xa869"; // Hexadecimal for 128, the chain ID for HECO mainnet

      if (chainId !== hecoChainId) {
        // Request to switch to HECO mainnet
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: hecoChainId }],
        });
      }

      const hecoBridgeContractInstatnce = new web3.eth.Contract(bridgeAbi, "0xD03441262A87c0Fa8acFDeEfDaAc0B5b1BEA19aA");
      await hecoBridgeContractInstatnce?.methods
        .sendToken("0x8FdC0cAb3bEB0AA517Ce8b5d10d28039188A4Dc7", "100000000000000000000")
        .send({ from: account.current });
      console.log("sent successfully");
    } catch (error) {
      console.log("error", error);
    }
  }, [bscBridgeContract, bscTokenContract, connectMetamask]);

  return (
    <>
      <Loading className="d-flex flex-column h-100" loading={loading} label={loadingLabel}>
        <div className="d-flex flex-center flex-column flex-lg-column-fluid py-5">
          <Card className="w-lg-500px p-3">
            <Form>
              <div className="d-flex align-items-center gap-3 mt-3">
                <div className="flex-row-fluid">
                  <Form.Label>From</Form.Label>
                  <Form.Select>
                    <option>BSC</option>
                  </Form.Select>
                </div>
                <i className="bi bi-arrow-left-right mt-30px"></i>
                <div className="flex-row-fluid">
                  <Form.Label>To</Form.Label>
                  <Form.Select>
                    <option>HECO</option>
                  </Form.Select>
                </div>
              </div>
              <Form.Group className="mt-3">
                <Form.Label>Token</Form.Label>
                <Form.Select>
                  <option>MDX</option>
                </Form.Select>
              </Form.Group>
              <Form.Group className="mt-3">
                <Form.Label>Amount</Form.Label>
                <Form.Control />
              </Form.Group>
              <Form.Group className="mt-3">
                <Form.Label>Recipient Address</Form.Label>
                <Form.Control />
              </Form.Group>
              <div className="d-grid mt-3">
                <Button onClick={swap}>Swap</Button>
              </div>
            </Form>
          </Card>
        </div>
      </Loading>
      <ToastContainer position="top-end" className="p-3">
        <Toast onClose={() => setToastVisible(false)} show={toastVisible} delay={3000} autohide bg={toastType}>
          <Toast.Header>
            <strong className="me-auto">{toastTitle}</strong>
          </Toast.Header>
          <Toast.Body>{toastContent}</Toast.Body>
        </Toast>
      </ToastContainer>
    </>
  );
}

export default App;
