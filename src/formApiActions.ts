// Functions that get form data and convert them into Polkadot API submittable payloads and signing keys

// @ts-ignore
import { ApiPromise } from "https://cdn.jsdelivr.net/npm/@polkadot/api@10.12.4/+esm";
// @ts-ignore
import { Bytes } from "https://cdn.jsdelivr.net/npm/@polkadot/types@10.12.4/+esm";
import { getHTMLInputValue, getSelectedOption } from "./domActions.js";
import { getCurrentItemizedHash, getCurrentPaginatedHash } from "./chainActions.js";

type AddProviderPayload = { authorizedMsaId: number; schemaIds: number[]; expiration: number };
type AddKeyData = { msaId: number; expiration: number; newPublicKey: string };

export type ExtrinsicFormData = {
  signingKey: string;
  delegatorKey: string;
  signatures: string[];
  payload: any;
};

export function getClaimHandleFormData(api: ApiPromise): ExtrinsicFormData {
  const signingKey = getSelectedOption("signing-address").value;
  // TODO: allow to claim handle by other account
  // const msaOwnerKey = getSelectedOption('claim_handle_msaOwnerKey').value;
  // const msaOwnerAccount = validAccounts[msaOwnerKey];
  const handle_vec = new Bytes(api.registry, getHTMLInputValue("claim_handle_handle"));
  const expiration = parseInt(getHTMLInputValue("claim_handle_expiration"), 10);

  const rawPayload = { baseHandle: handle_vec, expiration: expiration };
  const payload = api.registry.createType("CommonPrimitivesHandlesClaimHandlePayload", rawPayload);
  const signatures = [getHTMLInputValue("signed_payload")];
  return { signingKey, delegatorKey: "", signatures, payload };
}

export function getAddPublicKeyFormData(api: ApiPromise): ExtrinsicFormData {
  const signingKey = getSelectedOption("signing-address").value;
  const delegatorKey = getHTMLInputValue("add_public_key_to_msa_new_key");
  const expiration = parseInt(getHTMLInputValue("add_public_key_to_msa_expiration"));
  const signatures = [getHTMLInputValue("signed_payload")];

  let rawPayload: AddKeyData = {
    msaId: parseInt(getHTMLInputValue("add_public_key_to_msa_msa_id")),
    expiration: expiration,
    newPublicKey: delegatorKey,
  };
  const payload = api.registry.createType("PalletMsaAddKeyData", rawPayload);
  return { signingKey, delegatorKey, signatures, payload };
}

export function getCreateSponsoredAccountFormData(api: ApiPromise): ExtrinsicFormData {
  const signingKey = getSelectedOption("signing-address").value;
  const delegatorKey = getHTMLInputValue("create_sponsored_account_with_delegation_delegator_key");
  const authorizedMsaId = parseInt(getHTMLInputValue("create_sponsored_account_with_delegation_provider"));
  const expiration = parseInt(getHTMLInputValue("create_sponsored_account_with_delegation_expiration"));
  const schemaIds = getHTMLInputValue("create_sponsored_account_with_delegation_schema_ids")
    .split(",")
    .map((item) => parseInt(item.trim()));
  const signatures = [getHTMLInputValue("signed_payload")];

  const rawPayload: AddProviderPayload = { authorizedMsaId, expiration, schemaIds };
  const payload = api.registry.createType("PalletMsaAddProvider", rawPayload);
  return { signingKey, delegatorKey, signatures, payload };
}

export function getGrantDelegationFormData(api: ApiPromise): ExtrinsicFormData {
  const signingKey = getSelectedOption("signing-address").value;

  const delegatorKey = getHTMLInputValue("grant_delegation_delegator_key");

  const authorizedMsaId = parseInt(getHTMLInputValue("grant_delegation_provider"));
  const expiration = parseInt(getHTMLInputValue("grant_delegation_expiration"));
  const schemaIds = getHTMLInputValue("grant_delegation_schema_ids")
    .split(",")
    .map((item) => parseInt(item.trim()));
  const signatures = [getHTMLInputValue("signed_payload")];

  const rawPayload: AddProviderPayload = { authorizedMsaId, expiration, schemaIds };
  const payload = api.registry.createType("PalletMsaAddProvider", rawPayload);
  return { signingKey, delegatorKey, signatures, payload };
}

export async function getApplyItemActionsWithSignatureFormData(api: ApiPromise): Promise<ExtrinsicFormData> {
  const signingKey = getSelectedOption("signing-address").value;
  const delegatorKey = getHTMLInputValue("apply_item_actions_with_signature_delegator_key");

  const delegatorMsaId = parseInt(getHTMLInputValue("apply_item_actions_with_signature_delegator_msa"));
  const itemizedSchemaId = parseInt(getHTMLInputValue("apply_item_actions_with_signature_schema_id"));

  const firstAction = new Bytes(api.registry, getHTMLInputValue("apply_item_actions_with_signature_actions1"));

  const secondAction = new Bytes(api.registry, getHTMLInputValue("apply_item_actions_with_signature_actions2"));

  const expiration = parseInt(getHTMLInputValue("apply_item_actions_with_signature_expiration"));
  const targetHash = await getCurrentItemizedHash(api, delegatorMsaId, itemizedSchemaId);
  const addActions = [{ Add: firstAction }, { Add: secondAction }];
  const rawPayload = {
    msaId: delegatorMsaId,
    targetHash: targetHash,
    schemaId: itemizedSchemaId,
    actions: addActions,
    expiration,
  };
  const payload = api.registry.createType("PalletStatefulStorageItemizedSignaturePayload", rawPayload);
  const signatures = [getHTMLInputValue("signed_payload")];
  return { signingKey, delegatorKey, signatures, payload };
}

// ---------------------------------------------============================================

type UpsertPagePayload = {
  msaId: number;
  schemaId: number;
  pageId: number;
  targetHash: number;
  expiration: number;
  payload: string;
};

export async function getUpsertPageFormData(api: ApiPromise): Promise<ExtrinsicFormData> {
  const signingKey = getSelectedOption("signing-address").value;
  const signatures = [getHTMLInputValue("signed_payload")];

  const delegatorKey = getHTMLInputValue("upsert_page_with_signature_delegator_key");
  const msaId = parseInt(getHTMLInputValue("upsert_page_with_signature_msa_id"));
  const pageId: number = parseInt(getHTMLInputValue("upsert_page_with_signature_page_id"));
  const schemaId: number = parseInt(getHTMLInputValue("upsert_page_with_signature_schema_id"));
  const expiration: number = parseInt(getHTMLInputValue("upsert_page_with_signature_expiration"));
  const pageData: string = new Bytes(api.registry, getHTMLInputValue("upsert_page_with_signature_page_data"));

  let targetHash = await getCurrentPaginatedHash(api, msaId, schemaId, pageId);
  const upsertPayload: UpsertPagePayload = {
    msaId,
    targetHash,
    schemaId,
    pageId,
    expiration,
    payload: pageData,
  };
  const payload = api.registry.createType("PalletStatefulStoragePaginatedUpsertSignaturePayload", upsertPayload);
  return { signingKey, delegatorKey, payload, signatures };
}

type PaginatedDeleteSignaturePayload = {
  msaId: number;
  schemaId: number;
  pageId: number;
  targetHash: number;
  expiration: any;
};

export async function getDeletePageWithSignatureFormData(api: ApiPromise): Promise<ExtrinsicFormData> {
  const signingKey = getSelectedOption("signing-address").value;
  const signatures = [getHTMLInputValue("signed_payload")];

  const delegatorKey = getHTMLInputValue("delete_page_with_signature_delegator_key");
  const msaId = parseInt(getHTMLInputValue("delete_page_with_signature_msa_id"));
  const pageId: number = parseInt(getHTMLInputValue("delete_page_with_signature_page_id"));
  const schemaId: number = parseInt(getHTMLInputValue("delete_page_with_signature_schema_id"));
  const expiration: number = parseInt(getHTMLInputValue("delete_page_with_signature_expiration"));

  let targetHash = await getCurrentPaginatedHash(api, msaId, schemaId, pageId);
  const upsertPayload: PaginatedDeleteSignaturePayload = {
    msaId,
    targetHash,
    schemaId,
    pageId,
    expiration,
  };
  const payload = api.registry.createType("PalletStatefulStoragePaginatedUpsertSignaturePayload", upsertPayload);
  return { signingKey, delegatorKey, payload, signatures };
}
