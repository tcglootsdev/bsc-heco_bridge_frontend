import { useCallback, useEffect, useRef, useState } from "react";

import "./App.css";

// Bootstrap
import { Card, Form, Row, Col, Button } from "react-bootstrap";
import { useSDK } from "@metamask/sdk-react";

//web3
import { Web3 } from "web3";

//ABI
import bridgeAbi from "./bscBridgeContractABI.json";
function App() {
  const [bscTokenContract, setBscTokenContract] = useState(null);
  const [bscBridgeContract, setBscBridgeContract] = useState(null);

  const [hecoTokenContract, setHecoTokenContract] = useState(null);
  const [hecoBridgeContract, setHecoBridgeContract] = useState(null);

  const account = useRef(null);

  const { sdk, connected, connecting, provider, chainId } = useSDK();
  // const web3 = new Web3(new Web3.providers.HttpProvider("https://data-seed-prebsc-1-s1.binance.org:8545"));
  // console.log(window.web3.currentProvider)
  const web3 = new Web3(window.web3.currentProvider);

  const connect = useCallback((cb) => {
    sdk
      ?.connect()
      .then((accounts) => {
        account.current = accounts?.[0];
        cb();
      })
      .catch((error) => {
        console.warn("failed to connect..", error);
      });
  }, [sdk]);

  useEffect(() => {
    if (web3) {
      const bscContractAddress = "0x380694e9884E0Ad07b45a44Ed8F8920a5609fBE5";
      const bscContractABI = [
        {
          constant: false,
          inputs: [
            {
              name: "_spender",
              type: "address",
            },
            {
              name: "_value",
              type: "uint256",
            },
          ],
          name: "approve",
          outputs: [
            {
              name: "success",
              type: "bool",
            },
          ],
          payable: false,
          stateMutability: "nonpayable",
          type: "function",
        },
      ];
      const bscTokenContractInstatnce = new web3.eth.Contract(
        bscContractABI,
        bscContractAddress
      );
      setBscTokenContract(bscTokenContractInstatnce);
      setBscBridgeContract(
        new web3.eth.Contract(
          bridgeAbi,
          "0xc371d54583a9f7A1E3c6AAB329A7f0daE2274Dc4"
        )
      );
    }
  }, []);

  const swap = useCallback(async () => {
    if (!account.current) {
      connect(() => {
        swap();
      });
      return;
    }

    const spender = "0xc371d54583a9f7A1E3c6AAB329A7f0daE2274Dc4"; // Spender's address
    // Assuming amount is the number of tokens you want to approve
    console.log(spender)
    try {
      await bscTokenContract?.methods
        .approve(spender, "100000000000000000000")
        .send({ from: account.current });
      console.log("Approval successful");
      await bscBridgeContract?.methods
        .addLiquidity("100000000000000000000")
        .send({ from: account.current });
      console.log("add successfully");
     
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      const hecoChainId = '0xa869'; // Hexadecimal for 128, the chain ID for HECO mainnet

      if (chainId !== hecoChainId) {
        // Request to switch to HECO mainnet
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: hecoChainId }],
        });
      }

      // const hecoTokenContractInstatnce = new web3.eth.Contract(
      //   bscContractABI,
      //   bscContractAddress
      // );

      const hecoBridgeContractInstatnce = new web3.eth.Contract(
        bridgeAbi,
        "0xD03441262A87c0Fa8acFDeEfDaAc0B5b1BEA19aA"
      )
      await hecoBridgeContractInstatnce?.methods
        .sendToken( "0x8FdC0cAb3bEB0AA517Ce8b5d10d28039188A4Dc7", "100000000000000000000")
        .send({ from: account.current });
      console.log("sent successfully");

    } catch (error) {
      console.log("error", error);
    }
  }, [bscBridgeContract, bscTokenContract, connect]);

  return (
    <div className="d-flex flex-column h-100">
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
            <Form.Group className="mt-3" controlId="exampleForm.ControlInput1">
              <Form.Label>Token</Form.Label>
              <Form.Select>
                <option>MDX</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mt-3" controlId="exampleForm.ControlInput1">
              <Form.Label>Recipient Address</Form.Label>
              <Form.Control />
            </Form.Group>
            <div className="d-grid mt-3">
              <Button type="button" onClick={swap}>
                Swap
              </Button>
            </div>
          </Form>
        </Card>
      </div>
    </div>
  );
}

export default App;
