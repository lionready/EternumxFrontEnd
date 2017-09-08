import React, { Component } from 'react';
import axios from 'axios';
import moment from 'moment';

import '../css/order.scss';

import config from '../config';

import OrderInitial from './OrderInitial';
import OrderPayment from './OrderPayment';
import OrderPaid from './OrderPaid';
import OrderReleased from './OrderReleased';
import OrderSuccess from './OrderSuccess';
import OrderFailure from './OrderFailure';
import OrderExpired from './OrderExpired';
import OrderStatus from './OrderStatus';
import Bookmark from './Bookmark';
import NotFound from './NotFound';
import ReferralTerms from './ReferralTerms';


class Order extends Component {
	constructor(props) {
		super();
		this.state = {
			copied: false,
			depositCoinName: '...',
			createdOn: '...',
			timeRemaining: '...',
			depositAmount: '...',
			depositCoin: '...',
			depositAddress: '...',
			receiveAmount: '...',
			receiveCoin: '...',
			receiveAddress: '...',
			orderStatus: 1,
			expired: false,
			loading: true,
			paymentWindow: null,
			showBookmarkModal: false,
			showTermsModal: false,
			notFound: false,
			order: null,
			refCode: 'hello-this-is-ref'
		};

		this.getOrderDetails = this.getOrderDetails.bind(this);
		this.tick = this.tick.bind(this);
	}

	componentDidMount() {
		this.getOrderDetails();
	}

	tick() {
		if (this.state.createdOn == '...') return;

		let now = moment().subtract(this.state.paymentWindow, 'minutes');
		let createdOn = moment(this.state.createdOn);
		let diff = createdOn.diff(now);

		if (diff < 0) {
			this.setState({expired: true});
			clearInterval(this.interval);
			return;
		} else {
			diff = moment.utc(diff).format('mm:ss')
		}

		this.setState({
			timeRemaining: diff
		});
	}

	getOrderDetails() {
		axios.get(`${config.API_BASE_URL}/orders/${this.props.match.params.orderRef}/?_=${Math.round((new Date()).getTime())}`)
		.then((response) => {
			let data = response.data;

			this.setState({
				loading: false,
				depositAmount: parseFloat(data.amount_quote),
				depositCoin: data.deposit_address.currency_code,
				depositCoinName: data.pair.quote.name,
				depositAddress: data.deposit_address.address,
				receiveAmount: parseFloat(data.amount_base),
				receiveCoin: data.withdraw_address.currency_code,
				receiveAddress: data.withdraw_address.address,
				createdOn: data.created_on,
				orderStatus: data.status_name[0][0],
				paymentWindow: parseInt(data.payment_window),
				order: data
			}, () => {
				clearInterval(this.interval);
				this.interval = setInterval(this.tick, 1000);
				this.tick();

				this.timeout = setTimeout(() => {
					this.getOrderDetails();
				}, config.ORDER_DETAILS_FETCH_INTERVAL);
			})
		})
		.catch((error) => {
			if (error.response.status == 429) {
				this.timeout = setTimeout(() => {
					this.getOrderDetails();
				}, config.ORDER_DETAILS_FETCH_INTERVAL * 2);
			} else {
				this.setState({notFound: true});
			}
		});
	}

	componentDidUpdate(prevProps) {
		if (this.props.location !== prevProps.location) {
			clearTimeout(this.timeout);
			clearInterval(this.interval);
			this.getOrderDetails();
		}
	}

	componentWillUnmount() {
		clearInterval(this.interval);
		clearTimeout(this.timeout);
	}

	render() {
		if (this.state.notFound)
			return <NotFound />;

		let orderDetails = null;
		if (this.state.expired && this.state.orderStatus == 1)
			orderDetails = <OrderExpired />;
		else if (this.state.orderStatus == 1)
			orderDetails = <OrderInitial expired={this.state.expired} depositAmount={this.state.depositAmount} depositCoin={this.state.depositCoin} depositCoinName={this.state.depositCoinName} depositAddress={this.state.depositAddress}  timeRemaining={this.state.timeRemaining} />;
		else if (this.state.orderStatus == -1)
			orderDetails = <OrderPayment orderRef={this.props.match.params.orderRef} order={this.state.order} />;
		else if (this.state.orderStatus == 2)
			orderDetails = <OrderPaid orderRef={this.props.match.params.orderRef} order={this.state.order} />;
		else if (this.state.orderStatus == 3)
			orderDetails = <OrderReleased orderRef={this.props.match.params.orderRef} order={this.state.order} />;
		else if (this.state.orderStatus == 4)
			orderDetails = <OrderSuccess orderRef={this.props.match.params.orderRef} />;
		else if (this.state.orderStatus == 0 || this.state.orderStatus <= -2)
			orderDetails = <OrderFailure orderRef={this.props.match.params.orderRef} />;

		return (
			<div>
				<div id="order">
					<div className="container">
						<div className="row">
						    <div id="order-header" className="col-xs-12">
						    	<h3 id="order-ref">Order Reference: <b>{this.props.match.params.orderRef}</b></h3>
						    	<button id="bookmark-button" type="button" className="btn btn-default btn-simple" onClick={() => this.setState({showBookmarkModal:true})}>BOOKMARK</button>
						    </div>
						</div>

						<div className="row">
						    <div className="col-xs-12 col-sm-6">
						    	<div className="coin-box box media">
						    		<div className="media-left">
						    			<i className={`coin-icon cc-${this.state.depositCoin} ${this.state.depositCoin}`}></i>
						    		</div>

						    		<div className="media-body">
							    		<h5><b>Deposit {this.state.depositAmount} {this.state.depositCoin}</b></h5>
							    		<h6>{this.state.depositAddress}</h6>
						    		</div>
						    	</div>
						    </div>

						    <div className="col-xs-12 col-sm-6">
						    	<div className="coin-box box media">
						    		<div className="media-left">
						    			<i className={`coin-icon cc-${this.state.receiveCoin} ${this.state.receiveCoin}`}></i>
						    		</div>

						    		<div className="media-body">
							    		<h5><b>Receive {this.state.receiveAmount} {this.state.receiveCoin}</b></h5>
							    		<h6>{this.state.receiveAddress}</h6>
						    		</div>
						    	</div>
						    </div>

						    <div className="col-xs-12">
						    	<div className="box">
							    	<div className="row">
						    		{this.state.loading ?
						    			<div className="col-xs-12 text-center"><h2>Loading</h2></div> :
						    			orderDetails
						    		}
						    		</div>

						    		<div className="row">
						    			<div className="col-xs-12">
							    			<OrderStatus status={this.state.orderStatus} />
						    			</div>
						    		</div>
						    	</div>
						    </div>

						    <div id="share-referral" className="col-xs-12">
						    	<div className="box">
						    		<div className="row">
						    			<div className="col-xs-12">
											<h2>Earn free coins by referring your friends</h2>
											<h4>Here is your unique referral link: <a href={`${config.DOMAIN}?ref=${this.state.refCode}`} className="text-green">{config.DOMAIN}{this.state.refCode}</a></h4>
											<h4><a href="javascript:void(0)" onClick={() => this.setState({showTermsModal: true})}>Terms & Conditions</a></h4>

											<h4>Share it on social!</h4>
											
											<div className="share">
											    <a href={`https://facebook.com/sharer.php?u=${config.DOMAIN}?ref=${this.state.refCode}`} target="_blank"><i className="fa fa-facebook-official" aria-hidden="true"></i></a>
											    <a href={`https://twitter.com/intent/tweet?url=${config.DOMAIN}?ref=${this.state.refCode}&text=I’m%20using%20Nexchange,%20the%20easiest%20and%20fastest%20cryptocurrency%20exchange!`} target="_blank"><i className=	"fa fa-twitter-square" aria-hidden="true"></i></a>
											   	<a href={`https://www.linkedin.com/shareArticle?mini=true&url=${config.DOMAIN}?ref=${this.state.refCode}`} target="_blank"><i className=	"fa fa-linkedin-square" aria-hidden="true"></i></a>
											</div>
						    			</div>
						    		</div>
						    	</div>
						    </div>
						</div>
					</div>

					<ReferralTerms show={this.state.showTermsModal} onClose={() => this.setState({showTermsModal: false})} />
				    <Bookmark show={this.state.showBookmarkModal} onClose={() => this.setState({showBookmarkModal: false})} />
				</div>
			</div>
		);
	}
}

export default Order;
