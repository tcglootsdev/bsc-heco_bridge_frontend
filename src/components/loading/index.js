import React from "react";

// Bootstrap
import { Spinner } from "react-bootstrap/esm";

// Styles
import styles from "./style.module.css";

const Loading = (props) => {
  return (
    <div className={"position-relative" + (props.className ? " " + props.className : "")}>
      {props.children}
      {props.loading && (
        <div className={"position-absolute w-100 h-100 d-flex flex-center " + styles.loading}>
          <Spinner variant="primary" />
          <span className="ms-2">{props.label}</span>
        </div>
      )}
    </div>
  );
};

export default Loading;
