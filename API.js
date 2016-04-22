
//create a device in the DOM
{
	create: {
		r: '12345',
		o: 'some_device',
		dv: {
			id: 'ceiling_light',
			class: 'light ceiling',
			attr: {
				...
			}
		}
	}
}

//create a component under a device in the DOM
{
	create: {
		r: '12345',
		o: 'some_device',
		cm: {
			id: 'ceiling_light',
			class: 'light ceiling',
            p: 'parent',
			attr: {
				...
			}
		}
	}
}

//create a channel in the DOM
{
	create: {
		r: '12345',
		o: 'some_device',
		ch: {
			id: 'ceiling_light',
			class: 'light ceiling',
			attr: {
				...
			}
		}
	}
}

//returns the DOM element for the device
{
	read: {
		r: '12345',
		o: 'ceiling_light',
		s: '#home.bedroom#light',
		dv: {}
	}
}

//returns the DOM element for the channel
{
	read: {
		r: '12345',
		o: 'ceiling_light',
		s: '#home.bedroom#light',
		ch: {}
	}
}

//query a device for it's representation
{
	read: {
		r: '12345',
		o: 'ceiling_light',
		t: 'discover'
	}
}

//update the device representation in the DOM
{
	update: {
		r: '12345',
		o: 'ceiling_light',
		s: '#home.bedroom #light',
		dv: {
			class: 'multicolor touch',		//replace
			class: '+multicolor touch',		//add
			class: '-multicolor touch',		//remove
			css: {
				'background-color': 'burgandy',
				'power': 1
			}
			d: {
				...	//send some data
			}
		}
	}
}

//update a device's id/class (on the device itself)
{
	update: {
		r: '12345',
		o: 'ceiling_light',
		s: '#home.bedroom #light',
		dv: {
			id: 'new_id',
			class: 'multicolor touch',		//replace
			class: '+multicolor touch',		//add
			class: '-multicolor touch',		//remove
		}
	}
}

//update a channel in the DOM
{
	update: {
		r: '12345',
		o: 'ceiling_light',
		s: '#home #temperature',
		ch: {
			subscribers: '#some_device',
			subscribers: '+#some_device',
			subscribers: '-#some_device',
			class: 'temperature',				//replace
			class: '+temperature',				//add
			class: '-temperature',				//remove
			d: {								//data
				...
			}
		}
	}
}

//remove a device from the DOM
{
	delete: {
		r: '12345',
		o: 'some_device',
		s: '#home.bedroom#light',
		dv: {}
	}
}

//remove a channel from the DOM
{
	delete: {
		r: '12345',
		o: 'some_device',
		s: '#home.bedroom#light',
		ch: {}
	}
}


{
	response: {
		r: '12345',
		o: 'some_device',
		s: '#some_device',
		t: 'update',							//type: discover, create, update, delete
		st: 1,									//status: 1: success, 0: failure
		m: '',									//message: optional
		dv: {},									//device: optional
		d: {									//data: optional
			...
		}
	}
}

{
	publish: {
		r: '12345',
		o: 'ceiling_light',
		s: '#home.temperature',
		d: {
			...
		}
	}
}

reasons:
0: ok
1: general failure
2: timeout
3: specific failure, see message
