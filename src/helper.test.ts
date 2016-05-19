import test from "ava";
import { getHashes } from "./helper";

test("Get hashes from text", t => {
    let test = getHashes("jheh <#dkd> k jsdkf", hash => console.log(hash));
    console.log(`Hey ${test}`);
});