import React, { useState } from "react";
import Loader from "../Loader";
import { useCelo } from "@celo/react-celo";
import { AbiItem } from "web3-utils";
import { GeocodedFeature, packCellData } from "../../services/geocoding";
import ImovelRegistry from "../../web3/types/ImovelRegistry.json";
import { toast } from "react-toastify";

import "./DetailPanel.css";

type Props = {
  show: boolean;
  feature?: GeocodedFeature;
};

export default function DetailPanel(props: Props) {
  return (
    <div
      className={`sidebar flex-center right ${props.show ? "" : "collapsed"}`}
    >
      <div className="sidebar-content rounded-rect">
        {props.show ? (
          props.feature ? (
            <FeatureDetails feature={props.feature} />
          ) : (
            <Loader />
          )
        ) : (
          <></>
        )}
      </div>
    </div>
  );
}

function FeatureDetails(props: { feature: GeocodedFeature }) {
  const [registering, setRegistering] = useState(false);
  const { address, kit } = useCelo();

  async function onRegisterClick() {
    setRegistering(true);
    try {
      const imovelRegistry = new kit.connection.web3.eth.Contract(
        ImovelRegistry.abi as AbiItem[],
        "0xE6dE4daff89851E371506ee49148e55a2D1266F9"
      );

      const tx = await imovelRegistry.methods
        .claimLand(address, "", packCellData(props.feature.tokens))
        .send({ from: address, gas: 20000000 });

      console.log(tx);

      toast.success("Imóvel registrado com sucesso!");
    } catch (ex: any) {
      console.error("Houve um erro ao registrar imovel", ex);

      toast.error(
        <div>
          <h6>Houve um erro ao registrar o imóvel!</h6>
          <small className="text-error">Verifique a transação!</small>
        </div>
      );
    } finally {
      setRegistering(false);
    }
  }

  return (
    <form className="d-flex flex-column h-100">
      <div className="mb-3 pb-2 border-bottom">
        <h5 className="card-title">Registrar imóvel</h5>
      </div>
      <div className="flex-fill">
        <div className="row mb-2">
          <div className="col">
            <label className="small">Latitude:</label>
            <div className="">{props.feature.lat}</div>
          </div>
        </div>
        <div className="row mb-2">
          <div className="col">
            <label className="small ">Longitude:</label>
            <div className="">{props.feature.lng}</div>
          </div>
        </div>
        <div className="row mb-2">
          <div className="col">
            <label className="small">Qtd. Vértices:</label>
            <div className="">
              {props.feature.poly.coordinates[0].length - 1}
            </div>
          </div>
          <div className="col">
            <label className="small">Qtd. Células:</label>
            <div className="">{props.feature.tokens.length}</div>
          </div>
        </div>
      </div>
      <div className="d-grid">
        {!address ? (
          <span className="small text-danger">
            Conectar wallet para registrar imóvel
          </span>
        ) : (
          <></>
        )}
        <button
          type="submit"
          className="btn btn-primary"
          disabled={!address || registering}
          onClick={onRegisterClick}
        >
          {registering ? (
            <>
              <span>Registrando...</span>{" "}
              <span
                className="spinner-border spinner-border-sm"
                role="status"
                aria-hidden="true"
              ></span>
            </>
          ) : (
            <span>Registrar</span>
          )}
        </button>
      </div>
    </form>
  );
}
