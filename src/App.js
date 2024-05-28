import { useCallback, useEffect, useState } from "react";

import "./App.css";

// Bootstrap
import { Card, Form, Row, Col, Button } from "react-bootstrap";
import { useSDK } from "@metamask/sdk-react";

//web3
import { Web3 } from 'web3';

function App() {
  const [account, setAccount] = useState(null);
  const { sdk, connected, connecting, provider, chainId } = useSDK();
  const web3 = new Web3('https://rpc.ankr.com/bsc_testnet_chapel/32995e49d45223d3998a076f6633afe2f8d2c43036bad7b2cb6f792ad692a5e9');

  const connect = useCallback(async () => {
    try {
      const accounts = await sdk?.connect();
      setAccount(accounts?.[0]);
    } catch (error) {
      console.warn("failed to connect..", error);
    }
  }, [account]);

  useEffect(() => {
    web3.eth.getBlockNumber().then(console.log);
  }, [])

  const swap = useCallback(async () => {
    if (!account) await connect();

  }, [account]);

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
