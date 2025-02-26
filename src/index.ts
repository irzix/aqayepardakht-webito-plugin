// plugin.ts

import axios from 'axios';
import process from 'process';
import webito, { paymentsCreate_input, paymentsCreate_output, paymentsVerify_input } from 'webito-plugin-sdk'

const starter = new webito.WebitoPlugin('starter');

starter.registerHook(
    webito.hooks.paymentsCreate,
    async ({ variables, data }: { variables: { pin: string }, data: paymentsCreate_input }) => {
        const inputdata = {
            "pin": variables.pin,
            "amount": data.amount,
            "callback": data.callback,
            "description": data.payment,
        }
        const create = await axios.post('https://panel.aqayepardakht.ir/api/v2/create', inputdata)
        if (create.data.transid) {
            return {
                status: true,
                data: {
                    ...(create.data || {}),
                    url: 'https://panel.aqayepardakht.ir/startpay/' + create.data.transid
                }
            }
        } else {
            return {
                status: false,
            }
        }
    });

starter.registerHook(
    webito.hooks.paymentsVerify,
    async ({ variables, data }: { variables: { pin: string }, data: paymentsVerify_input }) => {
        const inputdata = {
            "pin": variables.pin,
            "amount": data.payment.amount,
            "transid": data.payment.transaction.transid,
        }
        const verify = await axios.post('https://panel.aqayepardakht.ir/api/v2/verify', inputdata)

        if ((verify.data.code == 1) || (verify.data.code == 2)) {
            return {
                status: true,
            }
        } else {
            return {
                status: false,
            }
        }
    });

const runPlugin = async (inputData: { hook: string; data: any }) => {
    const result = await starter.executeHook(inputData.hook, inputData.data);
    return result;
};


process.stdin.on('data', async (input) => {
    const msg = JSON.parse(input.toString());
    const result: any = await runPlugin(msg);
    starter.response({ status: result?.status, data: result?.data })
});